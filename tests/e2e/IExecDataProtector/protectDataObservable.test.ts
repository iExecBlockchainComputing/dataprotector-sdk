import fsPromises from 'fs/promises';
import path from 'path';
import { describe, it, expect, beforeEach } from '@jest/globals';
import { Wallet } from 'ethers';
import { IExecDataProtector } from '../../../dist/index';
import { ValidationError, WorkflowError } from '../../../dist/utils/errors';
import { getEthProvider, runObservableSubscribe } from '../../test-utils';

describe('dataProtector.protectDataObservable()', () => {
  let dataProtector: IExecDataProtector;
  let wallet: Wallet;
  beforeEach(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtector(getEthProvider(wallet.privateKey));
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

  it('checks ipfsNodeMultiaddr name is a string', () => {
    const invalid: any = 42;
    expect(() =>
      dataProtector.protectDataObservable({
        ipfsNodeMultiaddr: invalid,
        data: { doNotUse: 'test' },
      })
    ).toThrow(new ValidationError('ipfsNodeMultiaddr should be a string'));
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
    it('creates the protected data', async () => {
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

      expect(messages.length).toBe(9);

      expect(messages[0].message).toBe('DATA_SCHEMA_EXTRACTED');
      expect(messages[0].schema).toStrictEqual(expectedSchema);

      expect(messages[1].message).toBe('ZIP_FILE_CREATED');
      expect(messages[1].zipFile).toBeInstanceOf(Uint8Array);

      expect(messages[2].message).toBe('ENCRYPTION_KEY_CREATED');
      expect(typeof messages[2].encryptionKey).toBe('string');

      expect(messages[3].message).toBe('FILE_ENCRYPTED');
      expect(messages[3].encryptedFile).toBeInstanceOf(Uint8Array);
      expect(typeof messages[3].checksum).toBe('string');

      expect(messages[4].message).toBe('ENCRYPTED_FILE_UPLOADED');
      expect(typeof messages[4].cid).toBe('string');
      expect(typeof messages[4].multiaddr).toBe('string');

      expect(messages[5].message).toBe('PROTECTED_DATA_DEPLOYMENT_REQUEST');
      expect(messages[5].owner).toBe(wallet.address);
      expect(messages[5].name).toBe(DATA_NAME);
      expect(messages[5].schema).toStrictEqual(expectedSchema);
      expect(typeof messages[5].multiaddr).toBe('string');
      expect(typeof messages[5].checksum).toBe('string');

      expect(messages[6].message).toBe('PROTECTED_DATA_DEPLOYMENT_SUCCESS');
      expect(typeof messages[6].address).toBe('string');
      expect(messages[6].owner).toBe(wallet.address);
      expect(typeof messages[6].txHash).toBe('string');

      expect(messages[7].message).toBe('PUSH_SECRET_TO_SMS_REQUEST');

      expect(messages[8].message).toBe('PUSH_SECRET_TO_SMS_SUCCESS');
    }, 30_000);

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
