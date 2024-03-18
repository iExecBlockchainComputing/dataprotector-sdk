import { beforeAll, describe, expect, it } from '@jest/globals';
import { Wallet, type HDNodeWallet } from 'ethers';
import { IExecDataProtector } from '../../../src/index.js';
import { getTestConfig, timeouts } from '../../test-utils.js';
import { waitForSubgraphIndexing } from '../../unit/utils/waitForSubgraphIndexing.js';

describe('dataProtector.getSubscribers()', () => {
  let dataProtector: IExecDataProtector;
  let wallet: HDNodeWallet;

  beforeAll(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtector(...getTestConfig(wallet.privateKey));
  });

  describe('When calling getSubscribers()', () => {
    it(
      'should work',
      async () => {
        const { collectionTokenId } =
          await dataProtector.sharing.createCollection();

        const subscriptionParams = { priceInNRLC: 0, durationInSeconds: 2000 };
        await dataProtector.sharing.setSubscriptionParams({
          collectionTokenId,
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

        await dataProtector1.sharing.subscribe({
          collectionTokenId,
          duration: subscriptionParams.durationInSeconds,
        });
        await dataProtector2.sharing.subscribe({
          collectionTokenId,
          duration: subscriptionParams.durationInSeconds,
        });
        await dataProtector3.sharing.subscribe({
          collectionTokenId,
          duration: subscriptionParams.durationInSeconds,
        });

        await waitForSubgraphIndexing();

        const result = await dataProtector.sharing.getSubscribers({
          collectionTokenId,
          duration: subscriptionParams.durationInSeconds,
        });

        expect(result.subscribers.length).toBe(3);
      },
      timeouts.createCollection +
        timeouts.setSubscriptionParams +
        3 * timeouts.subscribe +
        timeouts.getSubscribers
    );
  });
});
