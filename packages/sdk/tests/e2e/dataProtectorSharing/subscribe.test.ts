import { beforeAll, describe, expect, it } from '@jest/globals';
import { Wallet, type HDNodeWallet } from 'ethers';
import { IExecDataProtector, getWeb3Provider } from '../../../src/index.js';
import {
  MAX_EXPECTED_BLOCKTIME,
  waitForSubgraphIndexing,
} from '../../test-utils.js';

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
        await waitForSubgraphIndexing();
        //Test price and duration values
        const priceInNRLC = BigInt('0');
        const durationInSeconds = 2000;
        await dataProtector.dataProtectorSharing.setSubscriptionParams({
          collectionTokenId,
          priceInNRLC,
          durationInSeconds,
        });

        waitForSubgraphIndexing();
        const { success } = await dataProtector.dataProtectorSharing.subscribe({
          collectionTokenId,
        });
        expect(success).toBe(true);
      },
      6 * MAX_EXPECTED_BLOCKTIME
    );
  });
});
