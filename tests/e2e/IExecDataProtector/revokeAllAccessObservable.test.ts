import { describe, it, expect, beforeAll, beforeEach } from '@jest/globals';
import { Wallet } from 'ethers';
import { IExecDataProtector } from '../../../dist/index';
import { ValidationError } from '../../../dist/utils/errors';
import {
  Address,
  ProtectedDataWithSecretProps,
} from '../../../dist/dataProtector/types';
import {
  getEthProvider,
  getRandomAddress,
  getRequiredFieldMessage,
  runObservableSubscribe,
} from '../../test-utils';

describe('dataProtector.revokeAllAccessObservable()', () => {
  const wallet = Wallet.createRandom();
  const dataProtector = new IExecDataProtector(
    getEthProvider(wallet.privateKey)
  );

  it('checks immediately protectedData is a required address or ENS', () => {
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
  });
  it('checks immediately authorizedApp is an address or ENS or "any"', () => {
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
  });
  it('checks immediately authorizedUser is an address or ENS or "any"', () => {
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
  });
  describe('subscribe()', () => {
    it('pass with a valid input', async () => {
      const observable = dataProtector.revokeAllAccessObservable({
        protectedData: getRandomAddress(),
      });
      const { completed, error } = await runObservableSubscribe(observable);
      expect(completed).toBe(true);
      expect(error).toBe(undefined);
    });

    describe('when an access is granted', () => {
      // same value used for the whole suite to save some execution time
      let protectedData: ProtectedDataWithSecretProps;
      beforeAll(async () => {
        protectedData = await dataProtector.protectData({
          data: { doNotUse: 'test' },
        });
      }, 30_000);

      let authorizedApp: Address;
      let authorizedUser: Address;
      beforeEach(async () => {
        authorizedApp = getRandomAddress();
        authorizedUser = getRandomAddress();
        await dataProtector.grantAccess({
          protectedData: protectedData.address,
          authorizedApp,
          authorizedUser,
        });
      }, 10_000);

      it('revokes the access when no option is passed', async () => {
        const observable = dataProtector.revokeAllAccessObservable({
          protectedData: protectedData.address,
        });
        const initialGrantedAccess = await dataProtector.fetchGrantedAccess({
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
          expect(messages[i + 1].access).toStrictEqual(initialGrantedAccess[i]);

          expect(messages[i + 2].message).toBe('REVOKE_ONE_ACCESS_SUCCESS');
          expect(messages[i + 2].access).toStrictEqual(initialGrantedAccess[i]);
          expect(typeof messages[i + 2].txHash).toBe('string');
        }

        const finalGrantedAccess = await dataProtector.fetchGrantedAccess({
          protectedData: protectedData.address,
        });
        expect(finalGrantedAccess.length).toBe(0);
      }, 30_000);
    });
  });
});
