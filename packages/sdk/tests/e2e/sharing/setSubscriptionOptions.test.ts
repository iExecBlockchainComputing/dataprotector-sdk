import { beforeAll, describe, expect, it } from '@jest/globals';
import { Wallet, type HDNodeWallet } from 'ethers';
import { IExecDataProtector, getWeb3Provider } from '../../../src/index.js';
import { MAX_EXPECTED_BLOCKTIME } from '../../test-utils.js';

describe('dataProtector.setSubscriptionOptions()', () => {
  let dataProtector: IExecDataProtector;
  let wallet: HDNodeWallet;

  beforeAll(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtector(getWeb3Provider(wallet.privateKey));
  });

  describe('When calling setSubscriptionOptions()', () => {
    it(
      'should answer with success true',
      async () => {
        //Test price and duration values
        const price = BigInt('100');
        const duration = 2000;
        const { collectionId } = await dataProtector.createCollection();

        const { success } = await dataProtector.setSubscriptionOptions({
          collectionTokenId: collectionId,
          durationInSeconds: duration,
          priceInNRLC: price,
        });
        expect(success).toBe(true);
      },
      4 * MAX_EXPECTED_BLOCKTIME
    );
  });
});
