import fsPromises from 'fs/promises';
import path from 'path';
import { beforeEach, describe, expect, it } from '@jest/globals';
import { HDNodeWallet, Wallet } from 'ethers';
import { IExecDataProtector, getWeb3Provider } from '../../src/index.js';
import { ValidationError, WorkflowError } from '../../src/utils/errors.js';
import {
  MAX_EXPECTED_BLOCKTIME,
  MAX_EXPECTED_WEB2_SERVICES_TIME,
  getTestConfig,
} from '../test-utils.js';

describe('dataProtector.protectData()', () => {
  let dataProtector: IExecDataProtector;
  let wallet: HDNodeWallet;
  beforeEach(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtector(...getTestConfig(wallet.privateKey));
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
    2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  it(
    'checks name is a string',
    async () => {
      const invalid: any = 42;
      await expect(() =>
        dataProtector.protectData({
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
    },
    2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  it(
    'checks ipfsNode is a url',
    async () => {
      const invalid: string = 'not a url';
      dataProtector = new IExecDataProtector(
        getWeb3Provider(wallet.privateKey),
        {
          ipfsNode: invalid,
        }
      );

      await expect(() =>
        dataProtector.protectData({
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
      dataProtector = new IExecDataProtector(
        getWeb3Provider(wallet.privateKey),
        {
          ipfsGateway: invalid,
        }
      );

      await expect(() =>
        dataProtector.protectData({
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
        dataProtector.protectData({
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
      const data = await dataProtector.protectData({
        data: { doNotUse: 'test' },
      });
      expect(data.name).toBe('');
    },
    2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
  );
});
