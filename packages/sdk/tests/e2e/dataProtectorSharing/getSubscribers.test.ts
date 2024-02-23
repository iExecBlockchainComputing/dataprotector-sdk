import { beforeAll, describe, expect, it } from '@jest/globals';
import { Wallet, type HDNodeWallet } from 'ethers';
import { IExecDataProtector, getWeb3Provider } from '../../../src/index.js';
import { waitForSubgraphIndexing } from '../../../src/lib/utils/waitForSubgraphIndexing.js';
import {
  MAX_EXPECTED_BLOCKTIME,
  MAX_EXPECTED_WEB2_SERVICES_TIME,
} from '../../test-utils.js';

describe('dataProtector.getSubscribers()', () => {
  let dataProtector: IExecDataProtector;
  let wallet: HDNodeWallet;

  beforeAll(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtector(getWeb3Provider(wallet.privateKey));
  });

  describe('When calling getSubscribers()', () => {
    it(
      'should work',
      async () => {
        const { collectionTokenId } =
          await dataProtector.dataProtectorSharing.createCollection();
        await waitForSubgraphIndexing();

        //Test price and duration values
        await dataProtector.dataProtectorSharing.setSubscriptionParams({
          collectionTokenId,
          priceInNRLC: BigInt('0'),
          durationInSeconds: 2000,
        });
        await waitForSubgraphIndexing();

        //simulate three subscribers
        const wallet1 = Wallet.createRandom();
        const dataProtector1 = new IExecDataProtector(
          getWeb3Provider(wallet1.privateKey)
        );
        const wallet2 = Wallet.createRandom();
        const dataProtector2 = new IExecDataProtector(
          getWeb3Provider(wallet2.privateKey)
        );
        const wallet3 = Wallet.createRandom();
        const dataProtector3 = new IExecDataProtector(
          getWeb3Provider(wallet3.privateKey)
        );

        await dataProtector1.dataProtectorSharing.subscribe({
          collectionTokenId,
        });
        await dataProtector2.dataProtectorSharing.subscribe({
          collectionTokenId,
        });
        await dataProtector3.dataProtectorSharing.subscribe({
          collectionTokenId,
        });
        await waitForSubgraphIndexing();

        const result = await dataProtector.dataProtectorSharing.getSubscribers({
          collectionTokenId,
        });
        await waitForSubgraphIndexing();

        expect(result.subscribers.length).toBe(3);
      },
      10 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
    );
  });
});
