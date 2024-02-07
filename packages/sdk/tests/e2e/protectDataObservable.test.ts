import fsPromises from 'fs/promises';
import path from 'path';
import { beforeEach, describe, expect, it } from '@jest/globals';
import { HDNodeWallet, Wallet } from 'ethers';
import { IExecDataProtector, getWeb3Provider } from '../../src/index.js';
import { ValidationError, WorkflowError } from '../../src/utils/errors.js';
import {
  MAX_EXPECTED_BLOCKTIME,
  MAX_EXPECTED_WEB2_SERVICES_TIME,
  runObservableSubscribe,
} from '../test-utils.js';

describe('dataProtector.protectDataObservable()', () => {
  let dataProtector: IExecDataProtector;
  let wallet: HDNodeWallet;
  beforeEach(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtector(getWeb3Provider(wallet.privateKey));
  });

  it(
    'checks immediately name is a string',
    () => {
      const invalid: any = 42;
      expect(() =>
        dataProtector.protectDataObservable({
          name: invalid,
          data: { doNotUse: 'test' },
        })
      ).toThrow(new ValidationError('name should be a string'));
    },
    2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  it(
    'checks immediately if the data is valid',
    () => {
      expect(() =>
        dataProtector.protectDataObservable({
          data: {
            'invalid.key': 'value',
          },
        })
      ).toThrow(
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
      const invalid: any = 'not a url';
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
    'checks immediately ipfsGateway is a url',
    async () => {
      const invalid: any = 'not a url';
      dataProtector = new IExecDataProtector(
        getWeb3Provider(wallet.privateKey),
        {
          ipfsGateway: invalid,
        }
      );
      expect(() =>
        dataProtector.protectDataObservable({
          data: { doNotUse: 'test' },
        })
      ).toThrow(new ValidationError('ipfsGateway should be a url'));
    },
    2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  describe('subscribe()', () => {
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
                    pngImage: 'string',
                    // pngImage: '', // commented as currently too large for IPFS upload
                  },
                },
              },
            },
          },
        };

        const observable = dataProtector.protectDataObservable({
          data,
          name: DATA_NAME,
        });
        const { messages, completed, error } = await runObservableSubscribe(
          observable
        );

        expect(error).toBeUndefined();
        expect(completed).toBe(true);

        expect(messages.length).toBe(9);

        expect(messages[0].message).toBe('DATA_SCHEMA_EXTRACTED');
        expect(messages[0].schema).toStrictEqual(expectedSchema);

        expect(messages[1].message).toBe('ZIP_FILE_CREATED');
        expect(messages[1].zipFile).toBeInstanceOf(Uint8Array);

        expect(messages[2].message).toBe('ENCRYPTION_KEY_CREATED');
        expect(typeof messages[2].encryptionKey).toBe('string');

        expect(messages[3].message).toBe('FILE_ENCRYPTED');
        expect(messages[3].encryptedFile).toBeInstanceOf(Uint8Array);

        expect(messages[4].message).toBe('ENCRYPTED_FILE_UPLOADED');
        expect(typeof messages[4].cid).toBe('string');

        expect(messages[5].message).toBe('PROTECTED_DATA_DEPLOYMENT_REQUEST');
        expect(messages[5].owner).toBe(wallet.address);
        expect(messages[5].name).toBe(DATA_NAME);
        expect(messages[5].schema).toStrictEqual(expectedSchema);

        expect(messages[6].message).toBe('PROTECTED_DATA_DEPLOYMENT_SUCCESS');
        expect(typeof messages[6].address).toBe('string');
        expect(messages[6].owner).toBe(wallet.address);
        expect(typeof messages[6].creationTimestamp).toBe('number');
        expect(typeof messages[6].txHash).toBe('string');

        expect(messages[7].message).toBe('PUSH_SECRET_TO_SMS_REQUEST');
        expect(messages[7].teeFramework).toBe('scone');

        expect(messages[8].message).toBe('PUSH_SECRET_TO_SMS_SUCCESS');
        expect(messages[8].teeFramework).toBe('scone');
      },
      2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
    );

    it(
      'calls error if the data cannot be serialized',
      async () => {
        const observable = dataProtector.protectDataObservable({
          data: {
            bigintOutOfI128Range: BigInt(
              '9999999999999999999999999999999999999999999999999999999999999999999'
            ),
          },
        });
        const { completed, error } = await runObservableSubscribe(observable);
        expect(completed).toBe(false);
        expect(error).toBeInstanceOf(WorkflowError);
        expect(error.message).toBe('Failed to serialize data object');
        expect(error.originalError).toStrictEqual(
          new Error('Unsupported integer value: out of i128 range')
        );
      },
      2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
    );
  });
});
