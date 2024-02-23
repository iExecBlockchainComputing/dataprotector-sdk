import { beforeAll, describe, expect, it } from '@jest/globals';
import { type HDNodeWallet, Wallet } from 'ethers';
import { getWeb3Provider, IExecDataProtector } from '../../../src/index.js';
import { timeouts } from '../../test-utils.js';

describe('dataProtector.subscribe()', () => {
  let dataProtector: IExecDataProtector;
  let wallet: HDNodeWallet;

  beforeAll(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtector(getWeb3Provider(wallet.privateKey));
  });

  describe('When calling subscribe()', () => {
    it(
      'should work',
      async () => {
        const { collectionTokenId } =
          await dataProtector.dataProtectorSharing.createCollection();

        await dataProtector.dataProtectorSharing.setSubscriptionParams({
          collectionTokenId,
          priceInNRLC: 0,
          durationInSeconds: 2000,
        });

        const { success } = await dataProtector.dataProtectorSharing.subscribe({
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
