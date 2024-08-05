import { describe, it, expect } from '@jest/globals';
import { HDNodeWallet, Wallet } from 'ethers';
import { ValidationError } from 'yup';
import { IExecDataProtectorCore } from '../../../src/index.js';
import {
  MAX_EXPECTED_BLOCKTIME,
  MAX_EXPECTED_WEB2_SERVICES_TIME,
  deployRandomApp,
  getRandomAddress,
  getTestConfig,
} from '../../test-utils.js';
import { WorkflowError } from '../../../src/index.js';
import { MarketCallError } from 'iexec/errors';

describe('dataProtectorCore.getGrantedAccess()', () => {
  let dataProtectorCore: IExecDataProtectorCore;
  let wallet: HDNodeWallet;

  beforeAll(async () => {
    wallet = Wallet.createRandom();
    dataProtectorCore = new IExecDataProtectorCore(
      ...getTestConfig(wallet.privateKey)
    );
  });

  it(
    'passes with valid input',
    async () => {
      const res = await dataProtectorCore.getGrantedAccess({});
      expect(res).toBeDefined();
    },
    MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  it(
    'accepts an optional protectedData to filter only access to a specific protectedData',
    async () => {
      const protectedData = getRandomAddress();
      const { grantedAccess: res } = await dataProtectorCore.getGrantedAccess({
        protectedData,
      });
      expect(res).toBeDefined();
      res.forEach((grantedAccess) => {
        expect(grantedAccess.dataset).toBe(protectedData);
      });
    },
    MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  it(
    'accepts an optional authorizedApp to filter only access granted to a specific app (including wildcards access)',
    async () => {
      const authorizedApp = getRandomAddress();
      const { grantedAccess: res } = await dataProtectorCore.getGrantedAccess({
        authorizedApp,
      });
      expect(res).toBeDefined();
      res.forEach((grantedAccess) => {
        expect(
          grantedAccess.apprestrict === authorizedApp ||
            grantedAccess.apprestrict ===
              '0x0000000000000000000000000000000000000000'
        ).toBe(true);
      });
    },
    MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  it(
    'accepts an optional authorizedUser to filter only access granted to a specific user (including wildcards access)',
    async () => {
      const authorizedUser = getRandomAddress();
      const { grantedAccess: res } = await dataProtectorCore.getGrantedAccess({
        authorizedUser,
      });
      expect(res).toBeDefined();
      expect(res).toBeDefined();
      res.forEach((grantedAccess) => {
        expect(
          grantedAccess.requesterrestrict === authorizedUser ||
            grantedAccess.requesterrestrict ===
              '0x0000000000000000000000000000000000000000'
        ).toBe(true);
      });
    },
    MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  it(
    'checks protectedData is an address or ENS"',
    async () => {
      await expect(
        dataProtectorCore.getGrantedAccess({
          protectedData: 'foo',
        })
      ).rejects.toThrow(
        new ValidationError(
          'protectedData should be an ethereum address or a ENS name'
        )
      );
    },
    MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  it(
    'checks authorizedApp is an address or ENS',
    async () => {
      await expect(
        dataProtectorCore.getGrantedAccess({
          protectedData: getRandomAddress(),
          authorizedApp: 'foo',
        })
      ).rejects.toThrow(
        new ValidationError(
          'authorizedApp should be an ethereum address or a ENS name'
        )
      );
    },
    MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  it(
    'checks authorizedUser is an address or ENS',
    async () => {
      await expect(
        dataProtectorCore.getGrantedAccess({
          protectedData: getRandomAddress(),
          authorizedUser: 'foo',
        })
      ).rejects.toThrow(
        new ValidationError(
          'authorizedUser should be an ethereum address or a ENS name'
        )
      );
    },
    MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  it(
    'should correctly create a protectedData, grant access, and fetch access for protected data',
    async () => {
      const userWalletAddress = Wallet.createRandom().address;
      const [protectedData, sconeAppAddress] = await Promise.all([
        dataProtectorCore.protectData({
          data: { doNotUse: 'test' },
        }),
        deployRandomApp({
          teeFramework: 'scone',
        }),
      ]);
      const grantedAccess = await dataProtectorCore.grantAccess({
        protectedData: protectedData.address,
        authorizedApp: sconeAppAddress,
        authorizedUser: userWalletAddress,
      });
      const { grantedAccess: fetchedContacts } =
        await dataProtectorCore.getGrantedAccess({
          protectedData: protectedData.address,
          authorizedApp: sconeAppAddress,
          authorizedUser: userWalletAddress,
        });
      const result = fetchedContacts.filter(
        (contact) =>
          contact.apprestrict.toLowerCase() === sconeAppAddress.toLowerCase() &&
          contact.requesterrestrict.toLowerCase() ===
            userWalletAddress.toLowerCase()
      );
      expect(result[0]).toEqual(grantedAccess);
    },
    4 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  describe('pagination - params validation', () => {
    it(
      'throws error when pageSize is less than 10',
      async () => {
        const getAccessPromise = dataProtectorCore.getGrantedAccess({
          protectedData: '0xbb673ac41acfbee381fe2e784d14c53b1cdc5946',
          authorizedApp: '0x82e41e1B594CcF69B0Cfda25637EdDc4E6D4e0fc',
          page: 0,
          pageSize: 9,
        });

        await expect(getAccessPromise).rejects.toThrow(
          new Error('pageSize must be greater than or equal to 10')
        );
      },
      MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
    );
  });

  describe('pagination', () => {
    async function grantAccessToRandomUsers(
      protectedData,
      sconeAppAddress,
      count
    ) {
      for (let i = 0; i < count; i++) {
        const userWalletAddress = Wallet.createRandom().address;
        await dataProtectorCore.grantAccess({
          protectedData: protectedData.address,
          authorizedApp: sconeAppAddress,
          authorizedUser: userWalletAddress,
        });
      }
    }

    const grantedAccessCount = 42;
    let protectedData;
    let sconeAppAddress;

    beforeAll(async () => {
      [protectedData, sconeAppAddress] = await Promise.all([
        dataProtectorCore.protectData({
          data: { doNotUse: 'pagination test' },
        }),
        deployRandomApp({
          ethProvider: getTestConfig(Wallet.createRandom().privateKey)[0],
          teeFramework: 'scone',
        }),
      ]);

      await grantAccessToRandomUsers(
        protectedData,
        sconeAppAddress,
        grantedAccessCount
      );
    }, (grantedAccessCount + 2) * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME);

    it(
      'returns the first page with 20 elements (default pageSize) when page and pageSize not specified',
      async () => {
        const grantedAccessResponse = await dataProtectorCore.getGrantedAccess({
          protectedData: protectedData.address,
          authorizedApp: sconeAppAddress,
        });
        expect(grantedAccessResponse.count).toBe(grantedAccessCount);
        expect(grantedAccessResponse.grantedAccess.length).toBe(20);
      },
      MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
    );

    it(
      'returns 20 elements (default pageSize) of granted access only for specified page',
      async () => {
        const grantedAccessResponse = await dataProtectorCore.getGrantedAccess({
          protectedData: protectedData.address,
          authorizedApp: sconeAppAddress,
          page: 1,
        });
        expect(grantedAccessResponse.grantedAccess.length).toBeLessThanOrEqual(
          20
        );
      },
      MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
    );

    it(
      'returns the remaining elements at the end if it is the last page',
      async () => {
        const grantedAccessResponse = await dataProtectorCore.getGrantedAccess({
          protectedData: protectedData.address,
          authorizedApp: sconeAppAddress,
          page: 2,
        });
        expect(grantedAccessResponse.grantedAccess.length).toBeLessThanOrEqual(
          2
        );
      },
      MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
    );

    it(
      'returns specified number of elements per page (first granted access)',
      async () => {
        const grantedAccessResponse = await dataProtectorCore.getGrantedAccess({
          protectedData: protectedData.address,
          authorizedApp: sconeAppAddress,
          pageSize: 13,
        });
        expect(grantedAccessResponse.grantedAccess.length).toBe(13);
      },
      MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
    );

    it(
      'returns granted access for specified page and pageSize',
      async () => {
        const grantedAccessResponse = await dataProtectorCore.getGrantedAccess({
          protectedData: protectedData.address,
          authorizedApp: sconeAppAddress,
          page: 0,
          pageSize: 15,
        });
        expect(grantedAccessResponse.grantedAccess.length).toBe(15);
      },
      MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
    );

    it(
      'returns no granted access for non-existent page',
      async () => {
        const grantedAccessResponse = await dataProtectorCore.getGrantedAccess({
          protectedData: protectedData.address,
          authorizedApp: sconeAppAddress,
          page: 100,
          pageSize: 20,
        });
        expect(grantedAccessResponse.grantedAccess.length).toBe(0);
      },
      MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
    );
  });

  it(
    'Throws error when the marketplace is unavailable',
    async () => {
      const iexecOptions = getTestConfig(wallet.privateKey)[1].iexecOptions;
      const provider = getTestConfig(wallet.privateKey)[0];
      const invalidIexecGatewayURL = 'https://unavailable.market.url';
      const unavailableDataProtector = new IExecDataProtectorCore(provider, {
        iexecOptions: {
          ...iexecOptions,
          iexecGatewayURL: invalidIexecGatewayURL,
        },
      });
      let error: WorkflowError | undefined;
      try {
        await unavailableDataProtector.getGrantedAccess({});
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
