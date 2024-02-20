import { beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { HDNodeWallet, Wallet } from 'ethers';
import { DataProtector, getWeb3Provider } from '../../../src/index.js';
import { ProtectedDataWithSecretProps } from '../../../src/lib/types/index.js';
import { ValidationError, WorkflowError } from '../../../src/utils/errors.js';
import {
  deployRandomApp,
  getRandomAddress,
  getRequiredFieldMessage,
  MAX_EXPECTED_BLOCKTIME,
  MAX_EXPECTED_WEB2_SERVICES_TIME,
} from '../../test-utils.js';

describe('dataProtector.grantAccess()', () => {
  // same values used for the whole suite to save some execution time
  let dataProtector: DataProtector;
  let wallet: HDNodeWallet;
  let protectedData: ProtectedDataWithSecretProps;
  let nonTeeAppAddress: string;
  let sconeAppAddress: string;
  const VALID_WHITELIST_CONTRACT = '0x680f6C2A2a6ce97ea632a7408b0E673396dd5581';
  const INVALID_WHITELIST_CONTRACT =
    '0xF2f72A635b41cDBFE5784A2C6Bdd349536967579';

  beforeAll(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new DataProtector(getWeb3Provider(wallet.privateKey));
    const results = await Promise.all([
      dataProtector.protectData({
        data: { doNotUse: 'test' },
      }),
      deployRandomApp(),
      deployRandomApp({ teeFramework: 'scone' }),
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
      await expect(
        dataProtector.grantAccess({ ...input, authorizedApp: sconeAppAddress })
      ).resolves.toBeDefined();
    },
    MAX_EXPECTED_WEB2_SERVICES_TIME
  );
  it(
    'infers the tag to use with a Scone app',
    async () => {
      const grantedAccess = await dataProtector.grantAccess({
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
    'checks protectedData is required address or ENS',
    async () => {
      await expect(
        dataProtector.grantAccess({ ...input, protectedData: undefined })
      ).rejects.toThrow(
        new ValidationError(getRequiredFieldMessage('protectedData'))
      );
      await expect(
        dataProtector.grantAccess({ ...input, protectedData: 'foo' })
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
        dataProtector.grantAccess({ ...input, authorizedApp: undefined })
      ).rejects.toThrow(
        new ValidationError(getRequiredFieldMessage('authorizedApp'))
      );
      await expect(
        dataProtector.grantAccess({ ...input, authorizedApp: 'foo' })
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
        dataProtector.grantAccess({ ...input, authorizedUser: undefined })
      ).rejects.toThrow(
        new ValidationError(getRequiredFieldMessage('authorizedUser'))
      );
      await expect(
        dataProtector.grantAccess({ ...input, authorizedUser: 'foo' })
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
        dataProtector.grantAccess({ ...input, pricePerAccess: -1 })
      ).rejects.toThrow(
        new ValidationError('pricePerAccess should be a positive integer')
      );
    },
    MAX_EXPECTED_WEB2_SERVICES_TIME
  );
  it('checks numberOfAccess is a strictly positive integer', async () => {
    await expect(
      dataProtector.grantAccess({ ...input, numberOfAccess: -1 })
    ).rejects.toThrow(
      new ValidationError(
        'numberOfAccess should be a strictly positive integer'
      )
    );
  });
  it(
    'fails if the app is not deployed',
    async () => {
      await expect(dataProtector.grantAccess({ ...input })).rejects.toThrow(
        new WorkflowError(
          'Failed to detect the app TEE framework',
          Error(`No app found for id ${input.authorizedApp} on chain 134`)
        )
      );
    },
    MAX_EXPECTED_WEB2_SERVICES_TIME
  );
  it(
    'fails if the app is not a TEE app',
    async () => {
      await expect(
        dataProtector.grantAccess({ ...input, authorizedApp: nonTeeAppAddress })
      ).rejects.toThrow(
        new WorkflowError(
          'App does not use a supported TEE framework',
          Error('App does not use a supported TEE framework')
        )
      );
    },
    MAX_EXPECTED_WEB2_SERVICES_TIME
  );
  it(
    'fails if the whitelist SC is not valid',
    async () => {
      await expect(
        dataProtector.grantAccess({
          ...input,
          authorizedApp: INVALID_WHITELIST_CONTRACT,
        })
      ).rejects.toThrow(
        new WorkflowError('Failed to detect the app TEE framework')
      );
    },
    MAX_EXPECTED_WEB2_SERVICES_TIME
  );
  it(
    'infers the tag to use with a whitelist smart contract',
    async () => {
      const grantedAccess = await dataProtector.grantAccess({
        ...input,
        authorizedApp: VALID_WHITELIST_CONTRACT,
      });
      expect(grantedAccess.tag).toBe(
        '0x0000000000000000000000000000000000000000000000000000000000000003'
      ); // ['tee', 'scone']
    },
    MAX_EXPECTED_WEB2_SERVICES_TIME
  );
});
