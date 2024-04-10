import { beforeAll, describe, expect, it, jest } from '@jest/globals';
import { Wallet } from 'ethers';
import { IExecDataProtector } from '../../../src/index.js';
import { getTestConfig, timeouts } from '../../test-utils.js';

describe.skip('dataProtector.consumeProtectedData()', () => {
  let dataProtectorCreator: IExecDataProtector;
  let dataProtectorEndUser: IExecDataProtector;

  beforeAll(async () => {
    const walletCreator = Wallet.createRandom();
    const walletEndUser = Wallet.createRandom();
    dataProtectorCreator = new IExecDataProtector(
      ...getTestConfig(walletCreator.privateKey)
    );
    dataProtectorEndUser = new IExecDataProtector(
      ...getTestConfig(walletEndUser.privateKey)
    );
  });

  describe('When calling consumeProtectedData() with valid inputs', () => {
    it(
      'should work',
      async () => {
        // --- GIVEN
        const { address: protectedData } =
          await dataProtectorCreator.core.protectData({
            data: { doNotUse: 'test' },
            name: 'test addToCollection',
          });
        const { collectionTokenId } =
          await dataProtectorCreator.sharing.createCollection();

        await dataProtectorCreator.sharing.addToCollection({
          collectionTokenId,
          protectedData,
        });

        await dataProtectorCreator.sharing.setProtectedDataToSubscription({
          protectedData,
        });

        const subscriptionParams = { priceInNRLC: 0, durationInSeconds: 86400 };
        await dataProtectorCreator.sharing.setSubscriptionParams({
          collectionTokenId,
          ...subscriptionParams,
        });

        await dataProtectorEndUser.sharing.subscribeToCollection({
          collectionTokenId,
          duration: subscriptionParams.durationInSeconds,
        });

        // --- WHEN
        const onStatusUpdateMock = jest.fn();
        await dataProtectorEndUser.sharing.consumeProtectedData({
          protectedData,
          onStatusUpdate: onStatusUpdateMock,
        });

        // --- THEN
        expect(onStatusUpdateMock).toHaveBeenCalledWith({
          title: 'CONSUME_PROTECTED_DATA',
          isDone: true,
        });
      },
      timeouts.protectData +
        timeouts.createCollection +
        timeouts.addToCollection +
        timeouts.setProtectedDataToSubscription +
        timeouts.setSubscriptionParams +
        timeouts.subscribe +
        timeouts.consumeProtectedData
    );
  });

  describe('When calling consumeProtectedData() with invalid rentals or subscriptions', () => {
    it(
      'should work',
      async () => {
        // --- GIVEN
        const { address: protectedData } =
          await dataProtectorCreator.core.protectData({
            data: { doNotUse: 'test' },
            name: 'test addToCollection',
          });
        const { collectionTokenId } =
          await dataProtectorCreator.sharing.createCollection();

        await dataProtectorCreator.sharing.addToCollection({
          collectionTokenId,
          protectedData,
        });

        // --- WHEN  --- THEN
        await expect(
          dataProtectorEndUser.sharing.consumeProtectedData({
            protectedData,
          })
        ).rejects.toThrow(
          new Error(
            "You are not allowed to consume this protected data. You need to rent it first, or to subscribe to the user's collection."
          )
        );
      },
      timeouts.protectData +
        timeouts.createCollection +
        timeouts.addToCollection +
        timeouts.consumeProtectedData
    );
  });
});
