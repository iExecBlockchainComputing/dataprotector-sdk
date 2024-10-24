import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { Wallet } from 'ethers';
import {
  IExecDataProtectorCore,
  Address,
  ProtectedDataWithSecretProps,
} from '../../../src/index.js';
import {
  deployRandomApp,
  getRandomAddress,
  getTestConfig,
  MAX_EXPECTED_BLOCKTIME,
  MAX_EXPECTED_MARKET_API_PURGE_TIME,
  MAX_EXPECTED_WEB2_SERVICES_TIME,
} from '../../test-utils.js';
import { sleep } from '../../utils/waitForSubgraphIndexing.js';

describe('dataProtectorCore.revokeAllAccess()', () => {
  const wallet = Wallet.createRandom();
  const dataProtectorCore = new IExecDataProtectorCore(
    ...getTestConfig(wallet.privateKey)
  );

  it(
    'pass with a valid input',
    async () => {
      await dataProtectorCore.revokeAllAccess({
        protectedData: getRandomAddress(),
      });
      expect(true).toBe(true);
    },
    MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  describe('when an access is granted', () => {
    // same value used for the whole suite to save some execution time
    let protectedData: ProtectedDataWithSecretProps;
    let sconeAppAddress: string;

    beforeAll(async () => {
      const result = await Promise.all([
        dataProtectorCore.protectData({
          data: { doNotUse: 'test' },
        }),
        deployRandomApp({
          ethProvider: getTestConfig(Wallet.createRandom().privateKey)[0],
          teeFramework: 'scone',
        }),
      ]);
      protectedData = result[0];
      sconeAppAddress = result[1];
    }, 4 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME);

    let authorizedUser: Address;

    beforeEach(async () => {
      authorizedUser = getRandomAddress();
      await dataProtectorCore.grantAccess({
        protectedData: protectedData.address,
        authorizedApp: sconeAppAddress,
        authorizedUser,
      });
    }, MAX_EXPECTED_WEB2_SERVICES_TIME);

    it(
      'revokes the access when no option is passed',
      async () => {
        const { grantedAccess: initialGrantedAccess } =
          await dataProtectorCore.getGrantedAccess({
            protectedData: protectedData.address,
          });
        expect(initialGrantedAccess.length > 0).toBe(true); // check test prerequisite

        const onStatusUpdateMock = jest.fn();
        const allAccessRevoked = await dataProtectorCore.revokeAllAccess({
          protectedData: protectedData.address,
          onStatusUpdate: onStatusUpdateMock,
        });
        expect(allAccessRevoked.length).toBe(1);

        expect(onStatusUpdateMock).toHaveBeenCalledTimes(
          2 + 2 * initialGrantedAccess.length
        );

        expect(onStatusUpdateMock).toHaveBeenNthCalledWith(1, {
          title: 'RETRIEVE_ALL_GRANTED_ACCESS',
          isDone: false,
        });
        expect(onStatusUpdateMock).toHaveBeenNthCalledWith(2, {
          title: 'RETRIEVE_ALL_GRANTED_ACCESS',
          isDone: true,
          payload: {
            grantedAccessCount: expect.any(String),
          },
        });

        for (let i = 0; i < initialGrantedAccess.length; i++) {
          expect(onStatusUpdateMock).toHaveBeenNthCalledWith(2 + i + 1, {
            title: 'REVOKE_ONE_ACCESS',
            isDone: false,
            payload: {
              access: expect.any(Object),
            },
          });

          expect(onStatusUpdateMock).toHaveBeenNthCalledWith(2 + i + 2, {
            title: 'REVOKE_ONE_ACCESS',
            isDone: true,
            payload: {
              access: expect.any(Object),
              txHash: expect.any(String),
            },
          });
        }

        await sleep(MAX_EXPECTED_MARKET_API_PURGE_TIME); // make sure to let enough time to the market API to purge the canceled order
        const { grantedAccess: finalGrantedAccess } =
          await dataProtectorCore.getGrantedAccess({
            protectedData: protectedData.address,
          });
        expect(finalGrantedAccess.length).toBe(0);
      },
      MAX_EXPECTED_WEB2_SERVICES_TIME + MAX_EXPECTED_MARKET_API_PURGE_TIME
    );
  });
});
