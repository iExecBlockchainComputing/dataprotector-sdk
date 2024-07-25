import fsPromises from 'fs/promises';
import path from 'path';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Wallet, HDNodeWallet, Contract } from 'ethers';
import { IExec, utils } from 'iexec';
import {
  DEFAULT_CONTRACT_ADDRESS,
  DEFAULT_IEXEC_IPFS_NODE,
  DEFAULT_IPFS_GATEWAY,
} from '../../../src/config/config.js';
import { ValidationError, WorkflowError } from '../../../src/utils/errors.js';

jest.unstable_mockModule('../../../src/services/ipfs.js', () => ({
  add: jest.fn(),
}));

jest.unstable_mockModule(
  '../../../src/lib/dataProtectorCore/smartContract/getContract.js',
  () => ({
    getContract: jest.fn(),
  })
);

const protectDataDefaultArgs = {
  contractAddress: DEFAULT_CONTRACT_ADDRESS,
  ipfsNode: DEFAULT_IEXEC_IPFS_NODE,
  ipfsGateway: DEFAULT_IPFS_GATEWAY,
};

describe('protectData()', () => {
  let testedModule: any;
  let wallet: HDNodeWallet;
  let iexec: IExec;

  beforeEach(async () => {
    wallet = Wallet.createRandom();
    iexec = new IExec({
      ethProvider: utils.getSignerFromPrivateKey(
        'https://bellecour.iex.ec',
        wallet.privateKey
      ),
    });

    // mock
    const ipfs: any = await import('../../../src/services/ipfs.js');
    ipfs.add.mockImplementation(() =>
      Promise.resolve('QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdsgaTQ')
    );

    const getContractModule: any = await import(
      '../../../src/lib/dataProtectorCore/smartContract/getDataWhitelistContract.js'
    );

    getContractModule.getContract.mockImplementation(() => ({
      createDatasetWithSchema: () =>
        Promise.resolve({
          wait: () =>
            Promise.resolve({
              logs: [
                {
                  eventName: 'DatasetSchema',
                  args: { dataset: 'mockedAddress' },
                },
              ],
              hash: 'mockedTxHash',
              blockNumber: 'latest',
            }),
        }),
    }));

    iexec.dataset.pushDatasetSecret = jest
      .fn()
      .mockImplementation(async () => true) as any;

    // import tested module after all mocked modules
    testedModule = await import(
      '../../../src/lib/dataProtectorCore/protectData.js'
    );
  });

  it('creates the protected data', async () => {
    const pngImage = await fsPromises.readFile(
      path.join(process.cwd(), 'tests', '_test_inputs_', 'image.png')
    );
    const data = {
      numberZero: 0,
      numberOne: 1,
      numberMinusOne: -1,
      numberPointOne: 0.1,
      bigintTen: BigInt(10),
      booleanTrue: true,
      booleanFalse: false,
      string: 'hello world!',
      nested: {
        object: {
          with: {
            binary: {
              data: {
                pngImage,
              },
            },
          },
        },
      },
    };
    const DATA_NAME = 'test do not use';
    const expectedSchema = {
      numberZero: 'f64',
      numberOne: 'f64',
      numberMinusOne: 'f64',
      numberPointOne: 'f64',
      bigintTen: 'i128',
      booleanTrue: 'bool',
      booleanFalse: 'bool',
      string: 'string',
      nested: {
        object: {
          with: {
            binary: {
              data: {
                pngImage: 'image/png',
              },
            },
          },
        },
      },
    };
    const result = await testedModule.protectData({
      iexec,
      ...protectDataDefaultArgs,
      data,
      name: DATA_NAME,
    });

    expect(result.name).toBe(DATA_NAME);
    expect(result.address).toBe('mockedAddress');
    expect(result.owner).toBe(wallet.address);
    expect(result.schema).toStrictEqual(expectedSchema);
    expect(typeof result.creationTimestamp).toBe('number');
    expect(result.transactionHash).toBe('mockedTxHash');
    expect(result.zipFile).toBeInstanceOf(Uint8Array);
    expect(typeof result.encryptionKey).toBe('string');
  });

  it('checks name is a string', async () => {
    const invalid: any = 42;
    await expect(() =>
      testedModule.protectData({
        iexec,
        name: invalid,
        ...protectDataDefaultArgs,
        data: { doNotUse: 'test' },
      })
    ).rejects.toThrow(new ValidationError('name should be a string'));
  });

  it('checks the data is suitable', async () => {
    await expect(() =>
      testedModule.protectData({
        iexec,
        ...protectDataDefaultArgs,
        data: { 'invalid.key': 'value' },
      })
    ).rejects.toThrow(
      new ValidationError(
        'data is not valid: Unsupported special character in key'
      )
    );
  });

  it('checks ipfsNode is a url', async () => {
    const invalid: any = 'not a url';
    await expect(() =>
      testedModule.protectData({
        iexec,
        ...protectDataDefaultArgs,
        ipfsNode: invalid,
        data: { doNotUse: 'test' },
      })
    ).rejects.toThrow(new ValidationError('ipfsNode should be a url'));
  });

  it('checks ipfsGateway is a url', async () => {
    await expect(() =>
      testedModule.protectData({
        iexec,
        ...protectDataDefaultArgs,
        ipfsGateway: 'tes.t',
        data: { doNotUse: 'test' },
      })
    ).rejects.toThrow(new ValidationError('ipfsGateway should be a url'));
  });

  it('throw if the data contains unsupported values', async () => {
    await expect(() =>
      testedModule.protectData({
        iexec,
        ...protectDataDefaultArgs,
        data: {
          tooLargeBigint: BigInt(
            '999999999999999999999999999999999999999999999999999999999999999999'
          ),
        },
      })
    ).rejects.toThrow(
      new WorkflowError({
        message: 'Failed to serialize data object',
        errorCause: new Error('Unsupported integer value: out of i128 range'),
      })
    );
  });

  it('sets the default name "Untitled"', async () => {
    const data = await testedModule.protectData({
      iexec,
      ...protectDataDefaultArgs,
      data: { doNotUse: 'test' },
    });
    expect(data.name).toBe('');
  });

  it('throws WorkflowError when upload to IPFS fails', async () => {
    // user reject
    const mockError = Error('Mock error');
    const ipfs: any = await import('../../../src/services/ipfs.js');
    ipfs.add.mockImplementation(() => Promise.reject(mockError));
    await expect(
      testedModule.protectData({
        iexec,
        ...protectDataDefaultArgs,
        data: { foo: 'bar' },
      })
    ).rejects.toThrow(
      new WorkflowError({
        message: 'Failed to upload encrypted data',
        errorCause: mockError,
      })
    );
  });

  it('throws WorkflowError when the dataset creation fails', async () => {
    // user reject
    const mockError = Error('Mock error');

    const getContractModule: any = await import(
      '../../../src/lib/dataProtectorCore/smartContract/getDataWhitelistContract.js'
    );

    // tx fail
    getContractModule.getContract.mockImplementation(() => ({
      createDatasetWithSchema: () =>
        Promise.resolve({
          wait: () => Promise.reject(mockError),
        }),
    }));
    Contract.prototype.connect = jest.fn().mockImplementation(() => ({
      createDatasetWithSchema: () => Promise.reject(mockError),
    })) as any;

    await expect(
      testedModule.protectData({
        iexec,
        ...protectDataDefaultArgs,
        data: { foo: 'bar' },
      })
    ).rejects.toThrow(
      new WorkflowError({
        message: 'Failed to create protected data into smart contract',
        errorCause: mockError,
      })
    );

    await expect(
      testedModule.protectData({
        iexec,
        ...protectDataDefaultArgs,
        data: { foo: 'bar' },
      })
    ).rejects.toThrow(
      new WorkflowError({
        message: 'Failed to create protected data into smart contract',
        errorCause: mockError,
      })
    );
  });

  it('throws WorkflowError when pushing the secret to the SMS fails', async () => {
    const mockError = Error('Mock error');
    iexec.dataset.pushDatasetSecret = jest
      .fn()
      .mockImplementation(() => Promise.reject(mockError)) as any;

    await expect(
      testedModule.protectData({
        iexec,
        ...protectDataDefaultArgs,
        data: { foo: 'bar' },
      })
    ).rejects.toThrow(
      new WorkflowError({
        message: 'Failed to push protected data encryption key',
        errorCause: mockError,
      })
    );
  });
});
