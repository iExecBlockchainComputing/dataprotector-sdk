import { beforeAll, describe, expect, it } from '@jest/globals';
import { Wallet, type HDNodeWallet } from 'ethers';
import { IExecDataProtector } from '../../../src/index.js';
import { getTestConfig, timeouts } from '../../test-utils.js';
import { waitForSubgraphIndexing } from '../../unit/utils/waitForSubgraphIndexing.js';

describe('dataProtector.getCollectionSubscriptions()', () => {
  let dataProtector: IExecDataProtector;
  let wallet: HDNodeWallet;

  beforeAll(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtector(...getTestConfig(wallet.privateKey));
  });

  describe('When calling getCollectionSubscriptions()', () => {
    it(
      'should work',
      async () => {
        const { collectionId } = await dataProtector.sharing.createCollection();

        const subscriptionParams = { priceInNRLC: 0, durationInSeconds: 2000 };
        await dataProtector.sharing.setSubscriptionParams({
          collectionId,
          ...subscriptionParams,
        });

        //simulate three subscribers
        const wallet1 = Wallet.createRandom();
        const dataProtector1 = new IExecDataProtector(
          ...getTestConfig(wallet1.privateKey)
        );
        const wallet2 = Wallet.createRandom();
        const dataProtector2 = new IExecDataProtector(
          ...getTestConfig(wallet2.privateKey)
        );
        const wallet3 = Wallet.createRandom();
        const dataProtector3 = new IExecDataProtector(
          ...getTestConfig(wallet3.privateKey)
        );

        await dataProtector1.sharing.subscribeToCollection({
          collectionId,
          duration: subscriptionParams.durationInSeconds,
        });
        await dataProtector2.sharing.subscribeToCollection({
          collectionId,
          duration: subscriptionParams.durationInSeconds,
        });
        await dataProtector3.sharing.subscribeToCollection({
          collectionId,
          duration: subscriptionParams.durationInSeconds,
        });

        await waitForSubgraphIndexing();

        const result = await dataProtector.sharing.getCollectionSubscriptions({
          collectionId,
        });

        expect(result.collectionSubscriptions.length).toBe(3);
      },
      timeouts.createCollection +
        timeouts.setSubscriptionParams +
        3 * timeouts.subscribe +
        timeouts.getCollectionSubscriptions
    );
  });

  describe('When calling getCollectionSubscriptions() with an invalid collectionID', () => {
    it(
      'should throw a validation error',
      async () => {
        const invalidTokenId = -1;
        await expect(
          dataProtector.sharing.getCollectionSubscriptions({
            collectionId: invalidTokenId,
          })
        ).rejects.toThrow(
          new Error('collectionId must be greater than or equal to 0')
        );
      },
      timeouts.getCollectionSubscriptions
    );
  });

  //TODO: add a test that checks wether the collection have subscription params or not
});
