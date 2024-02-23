import { beforeAll, describe, expect, it, jest } from '@jest/globals';
import { type HDNodeWallet, Wallet } from 'ethers';
import { getWeb3Provider, IExecDataProtector } from '../../../src/index.js';
import { timeouts } from '../../test-utils.js';

describe('dataProtector.consumeProtectedData()', () => {
  let dataProtector: IExecDataProtector;
  let wallet: HDNodeWallet;

  beforeAll(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtector(getWeb3Provider(wallet.privateKey));
  });

  describe.skip('When calling consumeProtectedData() with valid inputs', () => {
    it(
      'should work',
      async () => {
        // --- GIVEN
        const { address: protectedDataAddress } =
          await dataProtector.dataProtector.protectData({
            data: { doNotUse: 'test' },
            name: 'test addToCollection',
          });
        const { collectionTokenId } =
          await dataProtector.dataProtectorSharing.createCollection();

        await dataProtector.dataProtectorSharing.addToCollection({
          collectionTokenId,
          protectedDataAddress,
        });

        await dataProtector.dataProtectorSharing.setProtectedDataToSubscription(
          {
            protectedDataAddress,
          }
        );

        await dataProtector.dataProtectorSharing.setSubscriptionParams({
          collectionTokenId,
          priceInNRLC: 0,
          durationInSeconds: 86400, // 24h
        });

        await dataProtector.dataProtectorSharing.subscribe({
          collectionTokenId,
        });

        // --- WHEN
        const onStatusUpdateMock = jest.fn();
        await dataProtector.dataProtectorSharing.consumeProtectedData({
          protectedDataAddress,
          onStatusUpdate: onStatusUpdateMock,
        });

        // --- THEN
        expect(onStatusUpdateMock).toHaveBeenCalledWith({
          title: 'PROTECTED_DATA_CONSUMED',
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
          await dataProtector.dataProtector.protectData({
            data: { doNotUse: 'test' },
            name: 'test addToCollection',
          });
        const { collectionTokenId } =
          await dataProtector.dataProtectorSharing.createCollection();

        await dataProtector.dataProtectorSharing.addToCollection({
          collectionTokenId,
          protectedDataAddress,
        });

        // --- WHEN  --- THEN
        await expect(
          dataProtector.dataProtectorSharing.consumeProtectedData({
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
