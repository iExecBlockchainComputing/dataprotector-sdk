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
        const { collectionId } =
          await dataProtectorCreator.sharing.createCollection();

        const subscriptionParams = { priceInNRLC: 0, durationInSeconds: 2000 };
        await dataProtectorCreator.sharing.setSubscriptionParams({
          collectionId,
          ...subscriptionParams,
        });

        const subscribeResult =
          await dataProtectorEndUser.sharing.subscribeToCollection({
            collectionId,
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
        const collectionId = -1;
        const duration = 5000;
        // --- WHEN / THEN
        await expect(
          dataProtectorEndUser.sharing.subscribeToCollection({
            collectionId,
            duration,
          })
        ).rejects.toThrow(
          new Error('collectionId must be greater than or equal to 0')
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
        const collectionIdThatDoesNotExist = 9999999;
        const duration = 5000;
        // --- WHEN / THEN
        await expect(
          dataProtectorEndUser.sharing.subscribeToCollection({
            collectionId: collectionIdThatDoesNotExist,
            duration,
          })
        ).rejects.toThrow(
          new Error(
            `collectionId does not exist in the protectedDataSharing contract: ${collectionIdThatDoesNotExist}`
          )
        );
      },
      timeouts.subscribe
    );
  });
});
