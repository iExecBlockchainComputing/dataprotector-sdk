import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { HDNodeWallet, Wallet } from 'ethers';
import { MarketCallError } from 'iexec/errors';
import { IExecDataProtectorCore } from '../../../src/index.js';
import { ProtectedDataWithSecretProps } from '../../../src/lib/types/index.js';
import {
  ValidationError,
  WorkflowError,
  grantAccessErrorMessage,
} from '../../../src/utils/errors.js';
import {
  deployRandomApp,
  getRandomAddress,
  getRequiredFieldMessage,
  getTestConfig,
  getTestWeb3SignerProvider,
  MAX_EXPECTED_BLOCKTIME,
  MAX_EXPECTED_WEB2_SERVICES_TIME,
} from '../../test-utils.js';

describe('dataProtectorCore.grantAccess()', () => {
  // same values used for the whole suite to save some execution time
  let dataProtectorCore: IExecDataProtectorCore;
  let wallet: HDNodeWallet;
  let protectedData: ProtectedDataWithSecretProps;
  let nonTeeAppAddress: string;
  let sconeAppAddress: string;
  const VALID_WHITELIST_CONTRACT = '0x680f6C2A2a6ce97ea632a7408b0E673396dd5581';
  const INVALID_WHITELIST_CONTRACT =
    '0xF2f72A635b41cDBFE5784A2C6Bdd349536967579';

  beforeAll(async () => {
    wallet = Wallet.createRandom();
    dataProtectorCore = new IExecDataProtectorCore(
      ...getTestConfig(wallet.privateKey)
    );
    const results = await Promise.all([
      dataProtectorCore.protectData({
        data: { doNotUse: 'test' },
      }),
      deployRandomApp({
        ethProvider: getTestConfig(Wallet.createRandom().privateKey)[0],
      }),
      deployRandomApp({
        ethProvider: getTestConfig(Wallet.createRandom().privateKey)[0],
        teeFramework: 'scone',
      }),
    ]);
    protectedData = results[0];
    nonTeeAppAddress = results[1];
    sconeAppAddress = results[2];
  }, 6 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME);

  let input: any;
  beforeEach(() => {
    input = {
      protectedData: protectedData.address,
      authorizedApp: getRandomAddress(),
      authorizedUser: getRandomAddress(),
    };
  });

  it(
    'pass with valid input',
    async () => {
      const onStatusUpdateMock = jest.fn();
      const grantedAccess = await dataProtectorCore.grantAccess({
        ...input,
        authorizedApp: sconeAppAddress,
        onStatusUpdate: onStatusUpdateMock,
      });
      expect(grantedAccess).toBeDefined();

      expect(onStatusUpdateMock).toHaveBeenNthCalledWith(1, {
        title: 'CREATE_DATASET_ORDER',
        isDone: false,
      });
      expect(onStatusUpdateMock).toHaveBeenNthCalledWith(2, {
        title: 'CREATE_DATASET_ORDER',
        isDone: true,
      });
      expect(onStatusUpdateMock).toHaveBeenNthCalledWith(3, {
        title: 'PUBLISH_DATASET_ORDER',
        isDone: false,
      });
      expect(onStatusUpdateMock).toHaveBeenNthCalledWith(4, {
        title: 'PUBLISH_DATASET_ORDER',
        isDone: true,
      });
    },
    MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  it(
    'infers the tag to use with a Scone app',
    async () => {
      const grantedAccess = await dataProtectorCore.grantAccess({
        ...input,
        authorizedApp: sconeAppAddress,
      });
      expect(grantedAccess.tag).toBe(
        '0x0000000000000000000000000000000000000000000000000000000000000003'
      ); // ['tee', 'scone']
    },
    MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  it(
    'prevents address 0 to be used for authorizedApp', // this would allow any app including malicious apps
    async () => {
      await expect(
        dataProtectorCore.grantAccess({
          ...input,
          authorizedApp: '0x0000000000000000000000000000000000000000',
        })
      ).rejects.toThrow(
        new ValidationError(
          'Forbidden to use 0x0000000000000000000000000000000000000000 as authorizedApp, this would give access to any app'
        )
      );
    },
    MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  it(
    'checks protectedData is required address or ENS',
    async () => {
      await expect(
        dataProtectorCore.grantAccess({ ...input, protectedData: undefined })
      ).rejects.toThrow(
        new ValidationError(getRequiredFieldMessage('protectedData'))
      );
      await expect(
        dataProtectorCore.grantAccess({ ...input, protectedData: 'foo' })
      ).rejects.toThrow(
        new ValidationError(
          'protectedData should be an ethereum address or a ENS name'
        )
      );
    },
    MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  it(
    'checks authorizedApp is required address or ENS',
    async () => {
      await expect(
        dataProtectorCore.grantAccess({ ...input, authorizedApp: undefined })
      ).rejects.toThrow(
        new ValidationError(getRequiredFieldMessage('authorizedApp'))
      );
      await expect(
        dataProtectorCore.grantAccess({ ...input, authorizedApp: 'foo' })
      ).rejects.toThrow(
        new ValidationError(
          'authorizedApp should be an ethereum address or a ENS name'
        )
      );
    },
    MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  it(
    'checks authorizedUser is required address or ENS or "any"',
    async () => {
      await expect(
        dataProtectorCore.grantAccess({ ...input, authorizedUser: undefined })
      ).rejects.toThrow(
        new ValidationError(getRequiredFieldMessage('authorizedUser'))
      );
      await expect(
        dataProtectorCore.grantAccess({ ...input, authorizedUser: 'foo' })
      ).rejects.toThrow(
        new ValidationError(
          'authorizedUser should be an ethereum address, a ENS name, or "any"'
        )
      );
    },
    MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  it(
    'checks pricePerAccess is a positive integer',
    async () => {
      await expect(
        dataProtectorCore.grantAccess({ ...input, pricePerAccess: -1 })
      ).rejects.toThrow(
        new ValidationError('pricePerAccess should be a positive integer')
      );
    },
    MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  it('checks numberOfAccess is a strictly positive integer', async () => {
    await expect(
      dataProtectorCore.grantAccess({ ...input, numberOfAccess: -1 })
    ).rejects.toThrow(
      new ValidationError(
        'numberOfAccess should be a strictly positive integer'
      )
    );
  });

  it(
    'fails if the app is not deployed',
    async () => {
      await expect(dataProtectorCore.grantAccess({ ...input })).rejects.toThrow(
        new WorkflowError({
          message: grantAccessErrorMessage,
          errorCause: Error(
            `Invalid app set for address ${input.authorizedApp}. The app either has an invalid tag (possibly non-TEE) or an invalid whitelist smart contract address.`
          ),
        })
      );
    },
    MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  it(
    'fails if the app is not a TEE app',
    async () => {
      await expect(
        dataProtectorCore.grantAccess({
          ...input,
          authorizedApp: nonTeeAppAddress,
        })
      ).rejects.toThrow(
        new WorkflowError({
          message: grantAccessErrorMessage,
          errorCause: Error('App does not use a supported TEE framework'),
        })
      );
    },
    MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  it(
    'fails if the whitelist SC is not valid',
    async () => {
      await expect(
        dataProtectorCore.grantAccess({
          ...input,
          authorizedApp: INVALID_WHITELIST_CONTRACT,
        })
      ).rejects.toThrow(
        new WorkflowError({
          message: grantAccessErrorMessage,
          errorCause: Error(
            `Invalid app set for address ${INVALID_WHITELIST_CONTRACT}. The app either has an invalid tag (possibly non-TEE) or an invalid whitelist smart contract address.`
          ),
        })
      );
    },
    MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  it(
    'infers the tag to use with a whitelist smart contract',
    async () => {
      const grantedAccess = await dataProtectorCore.grantAccess({
        ...input,
        authorizedApp: VALID_WHITELIST_CONTRACT,
      });
      expect(grantedAccess.tag).toBe(
        '0x0000000000000000000000000000000000000000000000000000000000000003'
      ); // ['tee', 'scone']
    },
    MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  it(
    'Throws error when the marketplace is unavailable',
    async () => {
      const unavailableDataProtector = new IExecDataProtectorCore(
        getTestWeb3SignerProvider(wallet.privateKey),
        {
          iexecOptions: {
            iexecGatewayURL: 'https://unavailable.market.url',
          },
        }
      );
      let error: WorkflowError | undefined;
      try {
        const onStatusUpdateMock = jest.fn();
        await unavailableDataProtector.grantAccess({
          ...input,
          authorizedApp: sconeAppAddress,
          onStatusUpdate: onStatusUpdateMock,
        });
      } catch (e) {
        error = e as WorkflowError;
      }
      expect(error).toBeInstanceOf(WorkflowError);
      expect(error.message).toBe(
        "A service in the iExec protocol appears to be unavailable. You can retry later or contact iExec's technical support for help."
      );
      expect(error.cause).toStrictEqual(
        new MarketCallError(
          'Connection to https://unavailable.market.url failed with a network error',
          Error('')
        )
      );
      expect(error.isProtocolError).toBe(true);
    },
    MAX_EXPECTED_WEB2_SERVICES_TIME
  );
});
