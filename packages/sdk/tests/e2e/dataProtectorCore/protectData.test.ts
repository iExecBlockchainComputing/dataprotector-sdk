import fsPromises from 'fs/promises';
import path from 'path';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { HDNodeWallet, Wallet } from 'ethers';
import { IExecDataProtectorCore } from '../../../src/index.js';
import { ValidationError, WorkflowError } from '../../../src/utils/errors.js';
import {
  MAX_EXPECTED_BLOCKTIME,
  MAX_EXPECTED_WEB2_SERVICES_TIME,
  getTestConfig,
} from '../../test-utils.js';

describe('dataProtectorCore.protectData()', () => {
  let dataProtectorCore: IExecDataProtectorCore;
  let wallet: HDNodeWallet;
  beforeEach(async () => {
    wallet = Wallet.createRandom();
    dataProtectorCore = new IExecDataProtectorCore(
      ...getTestConfig(wallet.privateKey)
    );
  });

  it(
    'creates the protected data',
    async () => {
      // load some binary data
      await fsPromises.readFile(
        path.join(process.cwd(), 'tests', '_test_inputs_', 'image.png')
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

      const result = await dataProtectorCore.protectData({
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
    2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  it(
    'calls the onStatusUpdate() callback function at each step',
    async () => {
      // load some binary data
      await fsPromises.readFile(
        path.join(process.cwd(), 'tests', '_test_inputs_', 'image.png')
      );
      const data = {
        string: 'hello world!',
      };

      const DATA_NAME = 'test do not use';

      const onStatusUpdateMock = jest.fn();

      await dataProtectorCore.protectData({
        data,
        name: DATA_NAME,
        onStatusUpdate: onStatusUpdateMock,
      });

      expect(onStatusUpdateMock).toHaveBeenCalledTimes(14);

      expect(onStatusUpdateMock).toHaveBeenNthCalledWith(1, {
        title: 'EXTRACT_DATA_SCHEMA',
        isDone: false,
      });
      expect(onStatusUpdateMock).toHaveBeenNthCalledWith(2, {
        title: 'EXTRACT_DATA_SCHEMA',
        isDone: true,
      });

      expect(onStatusUpdateMock).toHaveBeenNthCalledWith(3, {
        title: 'CREATE_ZIP_FILE',
        isDone: false,
      });
      expect(onStatusUpdateMock).toHaveBeenNthCalledWith(4, {
        title: 'CREATE_ZIP_FILE',
        isDone: true,
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
    },
    2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  it(
    'checks name is a string',
    async () => {
      const invalid: any = 42;
      await expect(() =>
        dataProtectorCore.protectData({
          name: invalid,
          data: { doNotUse: 'test' },
        })
      ).rejects.toThrow(new ValidationError('name should be a string'));
    },
    2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  it(
    'checks the data is suitable',
    async () => {
      await expect(() =>
        dataProtectorCore.protectData({
          data: {
            'invalid.key': 'value',
          },
        })
      ).rejects.toThrow(
        new ValidationError(
          'data is not valid: Unsupported special character in key'
        )
      );
    },
    2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  it(
    'checks ipfsNode is a url',
    async () => {
      const invalid: string = 'not a url';
      dataProtectorCore = new IExecDataProtectorCore(
        getTestConfig(wallet.privateKey)[0],
        {
          ipfsNode: invalid,
        }
      );

      await expect(() =>
        dataProtectorCore.protectData({
          data: { doNotUse: 'test' },
        })
      ).rejects.toThrow(new ValidationError('ipfsNode should be a url'));
    },
    2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  it(
    'checks ipfsGateway is a url',
    async () => {
      const invalid: string = 'not a url';
      dataProtectorCore = new IExecDataProtectorCore(
        getTestConfig(wallet.privateKey)[0],
        {
          ipfsGateway: invalid,
        }
      );

      await expect(() =>
        dataProtectorCore.protectData({
          data: { doNotUse: 'test' },
        })
      ).rejects.toThrow(new ValidationError('ipfsGateway should be a url'));
    },
    2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  it(
    'throw if the data contains unsupported values',
    async () => {
      await expect(() =>
        dataProtectorCore.protectData({
          data: {
            unsupportedNumber: 1.1,
          },
        })
      ).rejects.toThrow(
        new WorkflowError('Failed to serialize data object', new Error())
      );
    },
    2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  it(
    'sets the default name to empty string when no name is passed',
    async () => {
      const data = await dataProtectorCore.protectData({
        data: { doNotUse: 'test' },
      });
      expect(data.name).toBe('');
    },
    2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
  );
});
