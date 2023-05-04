import fsPromises from 'fs/promises';
import path from 'path';
import { describe, it, expect, beforeEach } from '@jest/globals';
import { IExecDataProtector } from '../../../dist/index';
import { ValidationError, WorkflowError } from '../../../dist/utils/errors';
import { Wallet } from 'ethers';
import { getEthProvider } from './test-utils';

describe('dataProtector.protectData()', () => {
  let dataProtector: IExecDataProtector;
  let wallet: Wallet;
  beforeEach(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtector(getEthProvider(wallet.privateKey));
  });

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

    const result = await dataProtector.protectData({
      data,
      name: DATA_NAME,
    });

    expect(result.schema).toStrictEqual(expectedSchema);
    expect(result.zipFile).toBeInstanceOf(Uint8Array);
    expect(typeof result.encryptionKey).toBe('string');
    expect(typeof result.multiaddr).toBe('string');
    expect(result.owner).toBe(wallet.address);
    expect(result.name).toBe(DATA_NAME);
    expect(typeof result.multiaddr).toBe('string');
    expect(typeof result.address).toBe('string');
    // expect(result.encryptedFile).toBeInstanceOf(Uint8Array); // not exposed, should we?
    // expect(typeof result.checksum).toBe('string'); // not exposed, should we?
    // expect(typeof result.txHash).toBe('string'); // not exposed, should we?
  }, 30_000);

  it('throw if the data is not suitable', async () => {
    await expect(() =>
      dataProtector.protectData({
        data: {
          'invalid.key': 'value',
        },
      })
    ).rejects.toThrow(
      new ValidationError('Unsupported special character in key')
    );
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
});
