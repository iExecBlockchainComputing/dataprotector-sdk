import { beforeEach, describe, expect, it } from '@jest/globals';
import { Wallet } from 'ethers';
import fsPromises from 'fs/promises';
import path from 'path';
import { IExecDataProtector, getWeb3Provider } from '../../../dist/index';
import { ValidationError, WorkflowError } from '../../../dist/utils/errors';
import { MAX_EXPECTED_BLOCKTIME } from '../../test-utils';

describe('dataProtector.protectData()', () => {
  let dataProtector: IExecDataProtector;
  let wallet: Wallet;
  beforeEach(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtector(getWeb3Provider(wallet.privateKey));
  });

  // todo: mock the stack (this test currently runs on the prod stack)
  it(
    'creates the protected data',
    async () => {
      // load some binary data
      const pngImage = await fsPromises.readFile(
        path.join(process.cwd(), 'tests', '_test_inputs_', 'unicorn.png')
      );
      const data = {
        numberZero: 0,
        numberOne: 1,
        numberMinusOne: -1,
        booleanTrue: true,
        booleanFalse: false,
        string: 'hello world!',
        nested: {
          object: {
            with: {
              binary: {
                data: {
                  pngImage: 'placeholder',
                  // pngImage, // commented as currently too large for IPFS upload
                },
              },
            },
          },
        },
      };

      const DATA_NAME = 'test do not use';

      const expectedSchema = {
        numberZero: 'number',
        numberOne: 'number',
        numberMinusOne: 'number',
        booleanTrue: 'boolean',
        booleanFalse: 'boolean',
        string: 'string',
        nested: {
          object: {
            with: {
              binary: {
                data: {
                  pngImage: 'string',
                  // pngImage: '', // commented as currently too large for IPFS upload
                },
              },
            },
          },
        },
      };

      const result = await dataProtector.protectData({
        data,
        name: DATA_NAME,
      });
      expect(result.name).toBe(DATA_NAME);
      expect(typeof result.address).toBe('string');
      expect(result.owner).toBe(wallet.address);
      expect(result.schema).toStrictEqual(expectedSchema);
      expect(typeof result.creationTimestamp).toBe('number');
      expect(typeof result.transactionHash).toBe('string');
      expect(result.zipFile).toBeInstanceOf(Uint8Array);
      expect(typeof result.encryptionKey).toBe('string');
    },
    2 * MAX_EXPECTED_BLOCKTIME
  );

  it('checks name is a string', async () => {
    const invalid: any = 42;
    await expect(() =>
      dataProtector.protectData({
        name: invalid,
        data: { doNotUse: 'test' },
      })
    ).rejects.toThrow(new ValidationError('name should be a string'));
  });

  it('checks the data is suitable', async () => {
    await expect(() =>
      dataProtector.protectData({
        data: {
          'invalid.key': 'value',
        },
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
      dataProtector.protectData({
        ipfsNode: invalid,
        data: { doNotUse: 'test' },
      })
    ).rejects.toThrow(new ValidationError('ipfsNode should be a url'));
  });

  it('checks ipfsGateway is a url', async () => {
    await expect(() =>
      dataProtector.protectData({
        ipfsGateway: 'tes.t',
        data: { doNotUse: 'test' },
      })
    ).rejects.toThrow(new ValidationError('ipfsGateway should be a url'));
  });

  it('throw if the data schema cannot be extracted', async () => {
    await expect(() =>
      dataProtector.protectData({
        data: {
          unknownBytes: Buffer.from([0x01, 0x01, 0x01, 0x01]),
        },
      })
    ).rejects.toThrow(
      new WorkflowError('Failed to extract data schema', new Error())
    );
  });

  it('throw if the data contains unsupported values', async () => {
    await expect(() =>
      dataProtector.protectData({
        data: {
          unsupportedNumber: 1.1,
        },
      })
    ).rejects.toThrow(
      new WorkflowError('Failed to serialize data object', new Error())
    );
  });

  it(
    'sets the default name "Untitled"',
    async () => {
      const data = await dataProtector.protectData({
        data: { doNotUse: 'test' },
      });
      expect(data.name).toBe('Untitled');
    },
    2 * MAX_EXPECTED_BLOCKTIME
  );
});
