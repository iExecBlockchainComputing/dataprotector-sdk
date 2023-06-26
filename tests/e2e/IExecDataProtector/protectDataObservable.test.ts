import { beforeEach, describe, expect, it } from '@jest/globals';
import { Wallet } from 'ethers';
import fsPromises from 'fs/promises';
import path from 'path';
import { IExecDataProtector, getWeb3Provider } from '../../../dist/index';
import { ValidationError, WorkflowError } from '../../../dist/utils/errors';
import {
  MAX_EXPECTED_BLOCKTIME,
  runObservableSubscribe,
} from '../../test-utils';

describe('dataProtector.protectDataObservable()', () => {
  let dataProtector: IExecDataProtector;
  let wallet: Wallet;
  beforeEach(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtector(getWeb3Provider(wallet.privateKey));
  });

  it('checks immediately name is a string', () => {
    const invalid: any = 42;
    expect(() =>
      dataProtector.protectDataObservable({
        name: invalid,
        data: { doNotUse: 'test' },
      })
    ).toThrow(new ValidationError('name should be a string'));
  });

  it('checks immediately if the data is valid', () => {
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

  it('checks immediately ipfsGateway is a url', () => {
    expect(() =>
      dataProtector.protectDataObservable({
        ipfsGateway: 'tes.t',
        data: { doNotUse: 'test' },
      })
    ).toThrow(new ValidationError('ipfsGateway should be a url'));
  });

  describe('subscribe()', () => {
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

        const observable = dataProtector.protectDataObservable({
          data,
          name: DATA_NAME,
        });
        const { messages, completed, error } = await runObservableSubscribe(
          observable
        );

        expect(error).toBeUndefined();
        expect(completed).toBe(true);

        expect(messages.length).toBe(11);

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

        expect(messages[9].message).toBe('PUSH_SECRET_TO_SMS_REQUEST');
        expect(messages[9].teeFramework).toBe('gramine');

        expect(messages[10].message).toBe('PUSH_SECRET_TO_SMS_SUCCESS');
        expect(messages[10].teeFramework).toBe('gramine');
      },
      2 * MAX_EXPECTED_BLOCKTIME
    );

    it('calls error if the data schema cannot be extracted', async () => {
      const observable = dataProtector.protectDataObservable({
        data: {
          unknownBytes: Buffer.from([0x01, 0x01, 0x01, 0x01]),
        },
      });
      const { completed, error } = await runObservableSubscribe(observable);
      expect(completed).toBe(false);
      expect(error).toBeInstanceOf(WorkflowError);
      expect(error.message).toBe('Failed to extract data schema');
      expect(error.originalError).toStrictEqual(
        new Error('Failed to detect mime type')
      );
    });

    it('calls error if the data cannot be serialized', async () => {
      const observable = dataProtector.protectDataObservable({
        data: {
          unsupportedNumber: 1.1,
        },
      });
      const { completed, error } = await runObservableSubscribe(observable);
      expect(completed).toBe(false);
      expect(error).toBeInstanceOf(WorkflowError);
      expect(error.message).toBe('Failed to serialize data object');
      expect(error.originalError).toStrictEqual(
        new Error('Unsupported non safe integer number')
      );
    });
  });
});
