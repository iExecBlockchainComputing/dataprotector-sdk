import fsPromises from 'fs/promises';
import path from 'path';
import { beforeEach, describe, expect, it } from '@jest/globals';
import { HDNodeWallet, Wallet } from 'ethers';
import { IExec } from 'iexec';
import { SmsCallError } from 'iexec/errors';
import { DEFAULT_ARWEAVE_GATEWAY } from '../../../src/config/config.js';
import { IExecDataProtectorCore, WorkflowError } from '../../../src/index.js';
import {
  MAX_EXPECTED_BLOCKTIME,
  MAX_EXPECTED_WEB2_SERVICES_TIME,
  getTestConfig,
  getTestIExecOption,
  getTestRpcProvider,
  getTestWeb3SignerProvider,
} from '../../test-utils.js';
import {
  getArweaveUploadStubServer,
  ArweaveUploadStubServer,
} from '../../utils/arweaveUploadApi.js';

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
      expect(typeof result.multiaddr).toBe('string');
      expect(result.multiaddr.startsWith('/p2p/')).toBe(true);

      const ethProvider = getTestRpcProvider();
      const iexecOptions = getTestIExecOption();
      const iexecProd = new IExec({ ethProvider }, iexecOptions);
      const iexecDebug = new IExec(
        { ethProvider },
        { ...iexecOptions, smsURL: iexecOptions.smsDebugURL }
      );
      const prodSecretPushed = await iexecProd.dataset.checkDatasetSecretExists(
        result.address
      );
      const debugSecretPushed =
        await iexecDebug.dataset.checkDatasetSecretExists(result.address);
      expect(prodSecretPushed).toBe(true);
      expect(debugSecretPushed).toBe(false);
    },
    2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  it(
    'should throw error when sms is not available',
    async () => {
      const unavailableDataProtector = new IExecDataProtectorCore(
        getTestWeb3SignerProvider(wallet.privateKey),
        {
          iexecOptions: {
            ...getTestIExecOption(),
            smsURL: 'https://unavailable.sms.url',
          },
        }
      );
      let error: WorkflowError | undefined;
      try {
        await unavailableDataProtector.protectData({
          data: { doNotUse: 'test' },
        });
      } catch (e) {
        error = e as WorkflowError;
      }
      expect(error).toBeInstanceOf(WorkflowError);
      expect(error.message).toBe(
        "A service in the iExec protocol appears to be unavailable. You can retry later or contact iExec's technical support for help."
      );
      expect(error.cause).toStrictEqual(
        new SmsCallError(
          'Connection to https://unavailable.sms.url failed with a network error',
          Error('')
        )
      );
      expect(error.isProtocolError).toBe(true);
    },
    2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  describe('when `allowDebug: true`', () => {
    it(
      'creates the protected data with secret pushed on both prod and debug SMS',
      async () => {
        const data = {
          string: 'hello world!',
        };
        const DATA_NAME = 'test do not use';

        const result = await dataProtectorCore.protectData({
          data,
          name: DATA_NAME,
          allowDebug: true,
        });
        expect(result.name).toBe(DATA_NAME);
        expect(typeof result.address).toBe('string');
        expect(result.owner).toBe(wallet.address);
        expect(typeof result.creationTimestamp).toBe('number');
        expect(typeof result.transactionHash).toBe('string');
        expect(result.zipFile).toBeInstanceOf(Uint8Array);
        expect(typeof result.encryptionKey).toBe('string');

        const ethProvider = getTestRpcProvider();
        const iexecOptions = getTestIExecOption();
        const iexecProd = new IExec({ ethProvider }, iexecOptions);
        const iexecDebug = new IExec(
          { ethProvider },
          { ...iexecOptions, smsURL: iexecOptions.smsDebugURL }
        );
        const prodSecretPushed =
          await iexecProd.dataset.checkDatasetSecretExists(result.address);
        const debugSecretPushed =
          await iexecDebug.dataset.checkDatasetSecretExists(result.address);
        expect(prodSecretPushed).toBe(true);
        expect(debugSecretPushed).toBe(true);
      },
      2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
    );

    it(
      'should throw error when debug sms is not available',
      async () => {
        const unavailableDataProtector = new IExecDataProtectorCore(
          getTestWeb3SignerProvider(wallet.privateKey),
          {
            iexecOptions: {
              ...getTestIExecOption(),
              smsDebugURL: 'https://unavailable.debug-sms.url',
            },
          }
        );
        let error: WorkflowError | undefined;
        try {
          await unavailableDataProtector.protectData({
            data: { doNotUse: 'test' },
            allowDebug: true,
          });
        } catch (e) {
          error = e as WorkflowError;
        }
        expect(error).toBeInstanceOf(WorkflowError);
        expect(error.message).toBe(
          "A service in the iExec protocol appears to be unavailable. You can retry later or contact iExec's technical support for help."
        );
        expect(error.cause).toStrictEqual(
          new SmsCallError(
            'Connection to https://unavailable.debug-sms.url failed with a network error',
            Error('')
          )
        );
        expect(error.isProtocolError).toBe(true);
      },
      2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
    );
  });

  // TODO use a local service for Arweave upload API
  describe('when `uploadMode: "arweave"`', () => {
    let arweaveUploadServerStub: ArweaveUploadStubServer;
    beforeAll(async () => {
      arweaveUploadServerStub = await getArweaveUploadStubServer();
    });
    afterAll(async () => {
      await arweaveUploadServerStub.stop();
    });
    it(
      'creates the protected data',
      async () => {
        // load some binary data
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

        // override protected property to use stub server
        dataProtectorCore[
          // eslint-disable-next-line @typescript-eslint/dot-notation
          'arweaveUploadApi'
        ] = arweaveUploadServerStub.url;

        const result = await dataProtectorCore.protectData({
          data,
          uploadMode: 'arweave',
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
        expect(typeof result.multiaddr).toBe('string');
        expect(result.multiaddr.startsWith(DEFAULT_ARWEAVE_GATEWAY)).toBe(true);

        const ethProvider = getTestRpcProvider();
        const iexecOptions = getTestIExecOption();
        const iexecProd = new IExec({ ethProvider }, iexecOptions);
        const iexecDebug = new IExec(
          { ethProvider },
          { ...iexecOptions, smsURL: iexecOptions.smsDebugURL }
        );
        const prodSecretPushed =
          await iexecProd.dataset.checkDatasetSecretExists(result.address);
        const debugSecretPushed =
          await iexecDebug.dataset.checkDatasetSecretExists(result.address);
        expect(prodSecretPushed).toBe(true);
        expect(debugSecretPushed).toBe(false);
      },
      2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
    );
  });
});
