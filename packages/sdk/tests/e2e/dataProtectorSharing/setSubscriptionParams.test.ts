import { beforeAll, describe, expect, it } from '@jest/globals';
import { type HDNodeWallet, Wallet } from 'ethers';
import { getWeb3Provider, IExecDataProtector } from '../../../src/index.js';
import { timeouts } from '../../test-utils.js';

describe('dataProtector.setSubscriptionParams()', () => {
  let dataProtector: IExecDataProtector;
  let wallet: HDNodeWallet;

  beforeAll(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtector(getWeb3Provider(wallet.privateKey));
  });

  describe('When calling setSubscriptionParams()', () => {
    it(
      'should answer with success true',
      async () => {
        const { collectionTokenId } =
          await dataProtector.sharing.createCollection();

        const { success } =
          await dataProtector.sharing.setSubscriptionParams({
            collectionTokenId,
            priceInNRLC: 100,
            durationInSeconds: 2000,
          });
        expect(success).toBe(true);
      },
      timeouts.createCollection + timeouts.setSubscriptionParams
    );
  });
});
