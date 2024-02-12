import { beforeAll, describe, expect, it } from '@jest/globals';
import { Wallet, type HDNodeWallet } from 'ethers';
import { IExecDataProtector, getWeb3Provider } from '../../../src/index.js';
import { MAX_EXPECTED_BLOCKTIME } from '../../test-utils.js';

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
        const { collectionId } = await dataProtector.createCollection();
        //Test price and duration values
        const priceInNRLC = BigInt('0');
        const durationInSeconds = 2000;
        await dataProtector.setSubscriptionParams({
          collectionTokenId: collectionId,
          priceInNRLC,
          durationInSeconds,
        });
        const { success } = await dataProtector.subscribe({
          collectionId,
        });
        expect(success).toBe(true);
      },
      6 * MAX_EXPECTED_BLOCKTIME
    );
  });
});
