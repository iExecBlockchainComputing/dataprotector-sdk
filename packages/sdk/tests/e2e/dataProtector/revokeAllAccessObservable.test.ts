import { describe, it, expect, beforeAll, beforeEach } from '@jest/globals';
import { Wallet } from 'ethers';
import { DataProtector, getWeb3Provider } from '../../../src/index.js';
import {
  Address,
  ProtectedDataWithSecretProps,
} from '../../../src/lib/types/index.js';
import { ValidationError } from '../../../src/utils/errors.js';
import {
  MAX_EXPECTED_BLOCKTIME,
  MAX_EXPECTED_MARKET_API_PURGE_TIME,
  MAX_EXPECTED_WEB2_SERVICES_TIME,
  deployRandomApp,
  getRandomAddress,
  getRequiredFieldMessage,
  runObservableSubscribe,
  sleep,
} from '../../test-utils.js';

describe('dataProtector.revokeAllAccessObservable()', () => {
  const wallet = Wallet.createRandom();
  const dataProtector = new DataProtector(getWeb3Provider(wallet.privateKey));

  it(
    'checks immediately protectedData is a required address or ENS',
    () => {
      const undefinedValue: any = undefined;
      expect(() =>
        dataProtector.revokeAllAccessObservable({
          protectedData: undefinedValue,
        })
      ).toThrow(new ValidationError(getRequiredFieldMessage('protectedData')));
      const invalidValue: any = 'foo';
      expect(() =>
        dataProtector.revokeAllAccessObservable({
          protectedData: invalidValue,
        })
      ).toThrow(
        new ValidationError(
          'protectedData should be an ethereum address or a ENS name'
        )
      );
    },
    MAX_EXPECTED_WEB2_SERVICES_TIME
  );
  it(
    'checks immediately authorizedApp is an address or ENS or "any"',
    () => {
      const invalid: any = 42;
      expect(() =>
        dataProtector.revokeAllAccessObservable({
          protectedData: getRandomAddress(),
          authorizedApp: invalid,
        })
      ).toThrow(
        new ValidationError(
          'authorizedApp should be an ethereum address, a ENS name, or "any"'
        )
      );
    },
    MAX_EXPECTED_WEB2_SERVICES_TIME
  );
  it(
    'checks immediately authorizedUser is an address or ENS or "any"',
    () => {
      const invalid: any = 42;
      expect(() =>
        dataProtector.revokeAllAccessObservable({
          protectedData: getRandomAddress(),
          authorizedUser: invalid,
        })
      ).toThrow(
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
        const observable = dataProtector.revokeAllAccessObservable({
          protectedData: getRandomAddress(),
        });
        const { completed, error } = await runObservableSubscribe(observable);
        expect(completed).toBe(true);
        expect(error).toBe(undefined);
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
          const observable = dataProtector.revokeAllAccessObservable({
            protectedData: protectedData.address,
          });
          const { grantedAccess: initialGrantedAccess } =
            await dataProtector.fetchGrantedAccess({
              protectedData: protectedData.address,
            });
          expect(initialGrantedAccess.length > 0).toBe(true); // check test prerequisite
          const { messages, completed, error } = await runObservableSubscribe(
            observable
          );
          expect(completed).toBe(true);
          expect(error).toBeUndefined();
          expect(messages.length).toBe(1 + 2 * initialGrantedAccess.length);
          expect(messages[0].message).toBe('GRANTED_ACCESS_RETRIEVED');

          for (let i = 0; i < initialGrantedAccess.length; i++) {
            expect(messages[i + 1].message).toBe('REVOKE_ONE_ACCESS_REQUEST');
            expect(messages[i + 1].access).toStrictEqual(
              initialGrantedAccess[i]
            );

            expect(messages[i + 2].message).toBe('REVOKE_ONE_ACCESS_SUCCESS');
            expect(messages[i + 2].access).toStrictEqual(
              initialGrantedAccess[i]
            );
            expect(typeof messages[i + 2].txHash).toBe('string');
          }
          await sleep(MAX_EXPECTED_MARKET_API_PURGE_TIME); // make sure to let enough time to the market API to purge the canceled order
          const { grantedAccess: finalGrantedAccess } =
            await dataProtector.fetchGrantedAccess({
              protectedData: protectedData.address,
            });
          expect(finalGrantedAccess.length).toBe(0);
        },
        MAX_EXPECTED_WEB2_SERVICES_TIME + MAX_EXPECTED_MARKET_API_PURGE_TIME
      );
    });
  });
});
