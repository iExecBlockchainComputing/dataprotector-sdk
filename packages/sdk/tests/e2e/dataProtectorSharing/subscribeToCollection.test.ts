import { beforeAll, describe, expect, it } from '@jest/globals';
import { Wallet } from 'ethers';
import { IExecDataProtector } from '../../../src/index.js';
import { getTestConfig, timeouts } from '../../test-utils.js';

describe('dataProtector.subscribe()', () => {
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

  describe('When calling subscribe()', () => {
    it(
      'should work',
      async () => {
        const { collectionTokenId } =
          await dataProtectorCreator.sharing.createCollection();

        const subscriptionParams = { priceInNRLC: 0, durationInSeconds: 2000 };
        await dataProtectorCreator.sharing.setSubscriptionParams({
          collectionTokenId,
          ...subscriptionParams,
        });

        const subscribeResult =
          await dataProtectorEndUser.sharing.subscribeToCollection({
            collectionTokenId,
            duration: subscriptionParams.durationInSeconds,
          });
        expect(subscribeResult).toEqual({
          txHash: expect.any(String),
        });
      },
      timeouts.createCollection +
        timeouts.setSubscriptionParams +
        timeouts.subscribe
    );
  });

  describe('When calling subscribe() with invalid collection ID', () => {
    it(
      'should throw the corresponding error',
      async () => {
        const collectionTokenId = -1;
        const duration = 5000;
        // --- WHEN / THEN
        await expect(
          dataProtectorEndUser.sharing.subscribeToCollection({
            collectionTokenId,
            duration,
          })
        ).rejects.toThrow(
          new Error('collectionTokenId must be greater than or equal to 0')
        );
      },
      timeouts.subscribe
    );
  });

  describe('When calling subscribe() with collection ID that does not exist', () => {
    it(
      'should throw the corresponding error',
      async () => {
        // Increment this value as needed
        const collectionTokenIdThatDoesNotExist = 9999999;
        const duration = 5000;
        // --- WHEN / THEN
        await expect(
          dataProtectorEndUser.sharing.subscribeToCollection({
            collectionTokenId: collectionTokenIdThatDoesNotExist,
            duration,
          })
        ).rejects.toThrow(
          new Error(
            `CollectionTokenId does not exist in the protectedDataSharing contract: ${collectionTokenIdThatDoesNotExist}`
          )
        );
      },
      timeouts.subscribe
    );
  });
});
