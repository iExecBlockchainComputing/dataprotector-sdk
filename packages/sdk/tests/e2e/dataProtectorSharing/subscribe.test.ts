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
          await dataProtectorCreator.dataProtectorSharing.createCollection();

        await dataProtectorCreator.dataProtectorSharing.setSubscriptionParams({
          collectionTokenId,
          priceInNRLC: 0,
          durationInSeconds: 2000,
        });

        const { success } =
          await dataProtectorEndUser.dataProtectorSharing.subscribe({
            collectionTokenId,
          });
        expect(success).toBe(true);
      },
      timeouts.createCollection +
        timeouts.setSubscriptionParams +
        timeouts.subscribe
    );
  });
});
