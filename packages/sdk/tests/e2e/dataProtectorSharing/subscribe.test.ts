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

        const subscribeResult = await dataProtectorEndUser.sharing.subscribe({
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
});
