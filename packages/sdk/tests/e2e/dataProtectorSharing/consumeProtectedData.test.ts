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
        const { address: protectedDataAddress } =
          await dataProtectorCreator.dataProtector.protectData({
            data: { doNotUse: 'test' },
            name: 'test addToCollection',
          });
        const { collectionTokenId } =
          await dataProtectorCreator.dataProtectorSharing.createCollection();

        await dataProtectorCreator.dataProtectorSharing.addToCollection({
          collectionTokenId,
          protectedDataAddress,
        });

        await dataProtectorCreator.dataProtectorSharing.setProtectedDataToSubscription(
          {
            protectedDataAddress,
          }
        );

        await dataProtectorCreator.dataProtectorSharing.setSubscriptionParams({
          collectionTokenId,
          priceInNRLC: 0,
          durationInSeconds: 86400, // 24h
        });

        await dataProtectorEndUser.dataProtectorSharing.subscribe({
          collectionTokenId,
        });

        // --- WHEN
        const onStatusUpdateMock = jest.fn();
        await dataProtectorEndUser.dataProtectorSharing.consumeProtectedData({
          protectedDataAddress,
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
        const { address: protectedDataAddress } =
          await dataProtectorCreator.dataProtector.protectData({
            data: { doNotUse: 'test' },
            name: 'test addToCollection',
          });
        const { collectionTokenId } =
          await dataProtectorCreator.dataProtectorSharing.createCollection();

        await dataProtectorCreator.dataProtectorSharing.addToCollection({
          collectionTokenId,
          protectedDataAddress,
        });

        // --- WHEN  --- THEN
        await expect(
          dataProtectorEndUser.dataProtectorSharing.consumeProtectedData({
            protectedDataAddress,
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
