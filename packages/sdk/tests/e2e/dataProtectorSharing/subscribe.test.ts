import { beforeAll, describe, expect, it } from '@jest/globals';
import { Wallet } from 'ethers';
import { getWeb3Provider, IExecDataProtector } from '../../../src/index.js';
import { timeouts } from '../../test-utils.js';

describe('dataProtector.subscribe()', () => {
  let dataProtectorCreator: IExecDataProtector;
  let dataProtectorEndUser: IExecDataProtector;

  beforeAll(async () => {
    const walletCreator = Wallet.createRandom();
    const walletEndUser = Wallet.createRandom();
    dataProtectorCreator = new IExecDataProtector(
      getWeb3Provider(walletCreator.privateKey)
    );
    dataProtectorEndUser = new IExecDataProtector(
      getWeb3Provider(walletEndUser.privateKey)
    );
  });

  describe('When calling subscribe()', () => {
    it(
      'should work',
      async () => {
        const { collectionTokenId } =
          await dataProtectorCreator.sharing.createCollection();

        await dataProtectorCreator.sharing.setSubscriptionParams({
          collectionTokenId,
          priceInNRLC: 0,
          durationInSeconds: 2000,
        });

        const subscribeResult = await dataProtectorEndUser.sharing.subscribe({
          collectionTokenId,
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
