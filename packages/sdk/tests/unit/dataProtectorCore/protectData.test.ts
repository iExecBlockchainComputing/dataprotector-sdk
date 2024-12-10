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
import { type ProtectData } from '../../../src/lib/dataProtectorCore/protectData.js';
import { ValidationError, WorkflowError } from '../../../src/utils/errors.js';
import { getRandomAddress } from '../../test-utils.js';

jest.unstable_mockModule('../../../src/services/ipfs.js', () => ({
  add: jest.fn(),
}));

jest.unstable_mockModule(
  '../../../src/lib/dataProtectorCore/smartContract/getDataProtectorCoreContract.js',
  () => ({
    getDataProtectorCoreContract: jest
      .fn<
        () => Promise<{
          createDatasetWithSchema: () => any;
        }>
      >()
      .mockResolvedValue({
        createDatasetWithSchema: jest.fn(),
      }),
  })
);

jest.unstable_mockModule('../../../src/utils/getEventFromLogs.js', () => ({
  getEventFromLogs: jest.fn(),
}));

const protectDataDefaultArgs = {
  contractAddress: DEFAULT_CONTRACT_ADDRESS,
  ipfsNode: DEFAULT_IEXEC_IPFS_NODE,
  ipfsGateway: DEFAULT_IPFS_GATEWAY,
};

describe('protectData()', () => {
  let testedModule: any;
  let wallet: HDNodeWallet;
  let iexec: IExec;
  let protectData: ProtectData;

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
    ipfs.add.mockResolvedValue(
      'QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdsgaTQ'
    );

    const getContractModule: any = await import(
      '../../../src/lib/dataProtectorCore/smartContract/getDataProtectorCoreContract.js'
    );

    getContractModule.getDataProtectorCoreContract.mockImplementation(() => ({
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
      .fn<() => Promise<undefined>>()
      .mockResolvedValue(undefined);

    const getEventFromLogsModule: any = await import(
      '../../../src/utils/getEventFromLogs.js'
    );
    getEventFromLogsModule.getEventFromLogs.mockReturnValue({
      args: { dataset: 'mockedAddress' },
    });

    // import tested module after all mocked modules
    testedModule = await import(
      '../../../src/lib/dataProtectorCore/protectData.js'
    );
    protectData = testedModule.protectData;
  });

  describe('Check validation for input parameters', () => {
    describe('When given name is NOT a string but a number', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        // --- GIVEN
        const invalidProtectedDataName = 42;

        await expect(
          // --- WHEN
          protectData({
            iexec,
            // @ts-expect-error This is intended to actually test yup runtime validation
            name: invalidProtectedDataName,
          })
          // --- THEN
        ).rejects.toThrow(new ValidationError('name should be a string'));
      });
    });

    describe('When given name is NOT a string but an object', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        // --- GIVEN
        const invalidProtectedDataName = { myName: 'Test' };

        await expect(
          // --- WHEN
          protectData({
            iexec,
            // @ts-expect-error This is intended to actually test yup runtime validation
            name: invalidProtectedDataName,
          })
          // --- THEN
        ).rejects.toThrow(new ValidationError('name should be a string'));
      });
    });

    // TODO That should be validated at IExec SDK instantiation
    describe('When given IPFS node URL is NOT a proper URL', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        // --- GIVEN
        const invalidIpfsNodeUrl = 'not-a-url';

        await expect(
          // --- WHEN
          protectData({
            iexec,
            dataprotectorContractAddress: getRandomAddress(),
            name: 'Test',
            data: { myData: 'Test' },
            ipfsNode: invalidIpfsNodeUrl,
          })
          // --- THEN
        ).rejects.toThrow(new ValidationError('ipfsNode should be a url'));
      });
    });

    // TODO That should be validated at IExec SDK instantiation
    describe('When given IPFS gateway URL is NOT a proper URL', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        // --- GIVEN
        const invalidIpfsGatewayUrl = 'not-a-url';

        await expect(
          // --- WHEN
          protectData({
            iexec,
            dataprotectorContractAddress: getRandomAddress(),
            name: 'Test',
            data: { myData: 'Test' },
            ipfsGateway: invalidIpfsGatewayUrl,
          })
          // --- THEN
        ).rejects.toThrow(new ValidationError('ipfsGateway should be a url'));
      });
    });

    describe('When given data contains an invalid character in a field key', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        // --- GIVEN
        await expect(
          // --- WHEN
          protectData({
            iexec,
            dataprotectorContractAddress: getRandomAddress(),
            name: 'Test',
            data: { 'invalid.key': 'Test' },
          })
          // --- THEN
        ).rejects.toThrow(
          new ValidationError(
            'data is not valid: Unsupported special character in key'
          )
        );
      });
    });

    describe('When given data contains an invalid value for some field', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        // --- GIVEN
        await expect(
          // --- WHEN
          protectData({
            iexec,
            dataprotectorContractAddress: getRandomAddress(),
            name: 'Test',
            data: {
              tooLargeBigint: BigInt(
                '999999999999999999999999999999999999999999999999999999999999999999'
              ),
            },
          })
          // --- THEN
        ).rejects.toThrow(
          new WorkflowError({
            message: 'Failed to serialize data object',
            errorCause: new Error(
              'Unsupported integer value: out of i128 range'
            ),
          })
        );
      });
    });
  });

  describe('When it is a valid protectData() call', () => {
    it('should go fine and create the protected data', async () => {
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
      const result = await protectData({
        iexec,
        dataprotectorContractAddress: getRandomAddress(),
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
  });

  it('sets the default name to "" (empty string)', async () => {
    const data = await protectData({
      iexec,
      dataprotectorContractAddress: getRandomAddress(),
      ...protectDataDefaultArgs,
      data: { doNotUse: 'test' },
    });
    expect(data.name).toBe('');
  });

  describe('When upload to IPFS fails', () => {
    it('should throw a WorkflowError with the correct message', async () => {
      // --- GIVEN
      const ipfs: any = await import('../../../src/services/ipfs.js');
      ipfs.add.mockRejectedValue(new Error('Boom'));

      await expect(
        // --- WHEN
        protectData({
          iexec,
          dataprotectorContractAddress: getRandomAddress(),
          ...protectDataDefaultArgs,
          data: { foo: 'bar' },
        })
        // --- THEN
      ).rejects.toThrow(
        new WorkflowError({
          message: 'Failed to upload encrypted data',
          errorCause: Error('Boom'),
        })
      );
    });
  });

  describe('When the smart contract dataset creation fails', () => {
    it('should throw a WorkflowError with the correct message', async () => {
      // --- GIVEN
      const mockError = Error('Mock error');

      const getContractModule: any = await import(
        '../../../src/lib/dataProtectorCore/smartContract/getDataProtectorCoreContract.js'
      );

      // tx fail
      getContractModule.getDataProtectorCoreContract.mockImplementation(() => ({
        createDatasetWithSchema: () =>
          Promise.resolve({
            wait: () => Promise.reject(mockError),
          }),
      }));
      Contract.prototype.connect = jest.fn().mockImplementation(() => ({
        createDatasetWithSchema: () => Promise.reject(mockError),
      })) as any;

      await expect(
        // --- WHEN
        protectData({
          iexec,
          dataprotectorContractAddress: getRandomAddress(),
          ...protectDataDefaultArgs,
          data: { foo: 'bar' },
        })
        // --- THEN
      ).rejects.toThrow(
        new WorkflowError({
          message: 'Failed to create protected data into smart contract',
          errorCause: mockError,
        })
      );
    });
  });

  describe('When pushing the secret to the SMS fails', () => {
    it('should throw a WorkflowError with the correct message', async () => {
      // --- GIVEN
      iexec.dataset.pushDatasetSecret = jest
        .fn<() => Promise<undefined>>()
        .mockRejectedValue(new Error('Boom'));

      await expect(
        // --- WHEN
        protectData({
          iexec,
          dataprotectorContractAddress: getRandomAddress(),
          ...protectDataDefaultArgs,
          data: { foo: 'bar' },
        })
        // --- THEN
      ).rejects.toThrow(
        new WorkflowError({
          message: 'Failed to push protected data encryption key',
          errorCause: Error('Boom'),
        })
      );
    });
  });

  it('should call the onStatusUpdate() callback function at each step', async () => {
    // --- GIVEN
    const onStatusUpdateMock = jest.fn();

    // --- WHEN
    await protectData({
      iexec,
      dataprotectorContractAddress: getRandomAddress(),
      data: { foo: 'bar' },
      onStatusUpdate: onStatusUpdateMock,
    });

    // --- THEN
    expect(onStatusUpdateMock).toHaveBeenCalledTimes(14);

    expect(onStatusUpdateMock).toHaveBeenNthCalledWith(1, {
      title: 'EXTRACT_DATA_SCHEMA',
      isDone: false,
    });
    expect(onStatusUpdateMock).toHaveBeenNthCalledWith(2, {
      title: 'EXTRACT_DATA_SCHEMA',
      isDone: true,
      payload: {
        schema: {
          foo: 'string',
        },
      },
    });

    expect(onStatusUpdateMock).toHaveBeenNthCalledWith(3, {
      title: 'CREATE_ZIP_FILE',
      isDone: false,
    });
    expect(onStatusUpdateMock).toHaveBeenNthCalledWith(4, {
      title: 'CREATE_ZIP_FILE',
      isDone: true,
      payload: {
        zipFile: expect.any(Uint8Array),
      },
    });

    expect(onStatusUpdateMock).toHaveBeenNthCalledWith(5, {
      title: 'CREATE_ENCRYPTION_KEY',
      isDone: false,
    });
    expect(onStatusUpdateMock).toHaveBeenNthCalledWith(6, {
      title: 'CREATE_ENCRYPTION_KEY',
      isDone: true,
      payload: {
        encryptionKey: expect.any(String),
      },
    });

    expect(onStatusUpdateMock).toHaveBeenNthCalledWith(7, {
      title: 'ENCRYPT_FILE',
      isDone: false,
    });
    expect(onStatusUpdateMock).toHaveBeenNthCalledWith(8, {
      title: 'ENCRYPT_FILE',
      isDone: true,
    });

    expect(onStatusUpdateMock).toHaveBeenNthCalledWith(9, {
      title: 'UPLOAD_ENCRYPTED_FILE',
      isDone: false,
    });
    expect(onStatusUpdateMock).toHaveBeenNthCalledWith(10, {
      title: 'UPLOAD_ENCRYPTED_FILE',
      isDone: true,
      payload: {
        cid: expect.any(String),
      },
    });

    expect(onStatusUpdateMock).toHaveBeenNthCalledWith(11, {
      title: 'DEPLOY_PROTECTED_DATA',
      isDone: false,
    });
    expect(onStatusUpdateMock).toHaveBeenNthCalledWith(12, {
      title: 'DEPLOY_PROTECTED_DATA',
      isDone: true,
      payload: {
        address: expect.any(String),
        explorerUrl: expect.any(String),
        owner: expect.any(String),
        creationTimestamp: expect.any(String),
        txHash: expect.any(String),
      },
    });

    expect(onStatusUpdateMock).toHaveBeenNthCalledWith(13, {
      title: 'PUSH_SECRET_TO_SMS',
      isDone: false,
      payload: {
        teeFramework: expect.any(String),
      },
    });
    expect(onStatusUpdateMock).toHaveBeenNthCalledWith(14, {
      title: 'PUSH_SECRET_TO_SMS',
      isDone: true,
      payload: {
        teeFramework: expect.any(String),
      },
    });
  });
});
