import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { Wallet } from 'ethers';
import { ValidationError } from 'yup';
import { DataProtector, getWeb3Provider } from '../../../src/index.js';
import {
  Address,
  ProtectedDataWithSecretProps,
} from '../../../src/lib/types/index.js';
import {
  deployRandomApp,
  getRandomAddress,
  getRequiredFieldMessage,
  MAX_EXPECTED_BLOCKTIME,
  MAX_EXPECTED_MARKET_API_PURGE_TIME,
  MAX_EXPECTED_WEB2_SERVICES_TIME,
  sleep,
} from '../../test-utils.js';

describe('dataProtector.revokeAllAccess()', () => {
  const wallet = Wallet.createRandom();
  const dataProtector = new DataProtector(getWeb3Provider(wallet.privateKey));

  it(
    'checks immediately protectedData is a required address or ENS',
    async () => {
      const undefinedValue: any = undefined;
      await expect(() =>
        dataProtector.revokeAllAccess({
          protectedData: undefinedValue,
        })
      ).rejects.toThrow(
        new ValidationError(getRequiredFieldMessage('protectedData'))
      );
      const invalidValue: any = 'foo';

      await expect(() =>
        dataProtector.revokeAllAccess({
          protectedData: invalidValue,
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
    'checks immediately authorizedApp is an address or ENS or "any"',
    async () => {
      const invalid: any = 42;
      await expect(() =>
        dataProtector.revokeAllAccess({
          protectedData: getRandomAddress(),
          authorizedApp: invalid,
        })
      ).rejects.toThrow(
        new ValidationError(
          'authorizedApp should be an ethereum address, a ENS name, or "any"'
        )
      );
    },
    MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  it(
    'checks immediately authorizedUser is an address or ENS or "any"',
    async () => {
      const invalid: any = 42;
      await expect(() =>
        dataProtector.revokeAllAccess({
          protectedData: getRandomAddress(),
          authorizedUser: invalid,
        })
      ).rejects.toThrow(
        new ValidationError(
          'authorizedUser should be an ethereum address, a ENS name, or "any"'
        )
      );
    },
    MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  describe('subscribe()', () => {
    it(
      'pass with a valid input',
      async () => {
        const { success } = await dataProtector.revokeAllAccess({
          protectedData: getRandomAddress(),
        });
        expect(success).toBe(true);
      },
      MAX_EXPECTED_WEB2_SERVICES_TIME
    );

    describe('when an access is granted', () => {
      // same value used for the whole suite to save some execution time
      let protectedData: ProtectedDataWithSecretProps;
      let sconeAppAddress: string;

      beforeAll(async () => {
        const result = await Promise.all([
          dataProtector.protectData({
            data: { doNotUse: 'test' },
          }),
          deployRandomApp({ teeFramework: 'scone' }),
        ]);
        protectedData = result[0];
        sconeAppAddress = result[1];
      }, 4 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME);

      let authorizedUser: Address;

      beforeEach(async () => {
        authorizedUser = getRandomAddress();
        await dataProtector.grantAccess({
          protectedData: protectedData.address,
          authorizedApp: sconeAppAddress,
          authorizedUser,
        });
      }, MAX_EXPECTED_WEB2_SERVICES_TIME);

      it(
        'revokes the access when no option is passed',
        async () => {
          const { grantedAccess: initialGrantedAccess } =
            await dataProtector.getGrantedAccess({
              protectedData: protectedData.address,
            });
          expect(initialGrantedAccess.length > 0).toBe(true); // check test prerequisite

          const onStatusUpdateMock = jest.fn();
          const { success } = await dataProtector.revokeAllAccess({
            protectedData: protectedData.address,
            onStatusUpdate: onStatusUpdateMock,
          });
          expect(success).toBe(true);

          expect(onStatusUpdateMock).toHaveBeenCalledTimes(
            2 + 2 * initialGrantedAccess.length
          );

          expect(onStatusUpdateMock).toHaveBeenCalledWith({
            title: 'RETRIEVE_ALL_GRANTED_ACCESS',
            isDone: false,
          });
          expect(onStatusUpdateMock).toHaveBeenCalledWith({
            title: 'RETRIEVE_ALL_GRANTED_ACCESS',
            isDone: true,
            payload: {
              grantedAccessCount: expect.any(String),
            },
          });

          for (let i = 0; i < initialGrantedAccess.length; i++) {
            expect(onStatusUpdateMock).toHaveBeenCalledWith({
              title: 'REVOKE_ONE_ACCESS',
              isDone: false,
              payload: {
                requesterAddress: expect.any(String),
              },
            });

            expect(onStatusUpdateMock).toHaveBeenCalledWith({
              title: 'REVOKE_ONE_ACCESS',
              isDone: true,
              payload: {
                requesterAddress: expect.any(String),
                txHash: expect.any(String),
              },
            });
          }

          await sleep(MAX_EXPECTED_MARKET_API_PURGE_TIME); // make sure to let enough time to the market API to purge the canceled order
          const { grantedAccess: finalGrantedAccess } =
            await dataProtector.getGrantedAccess({
              protectedData: protectedData.address,
            });
          expect(finalGrantedAccess.length).toBe(0);
        },
        MAX_EXPECTED_WEB2_SERVICES_TIME + MAX_EXPECTED_MARKET_API_PURGE_TIME
      );
    });
  });
});
