import { beforeAll, describe, expect, it } from '@jest/globals';
import { JsonRpcProvider, Wallet, type HDNodeWallet } from 'ethers';
import { IExecDataProtector } from '../../../src/index.js';
import { getTestConfig, timeouts } from '../../test-utils.js';
import { anvilSetBalance } from '../../utils/anvil.js';

describe('dataProtector.withdraw()', () => {
  let dataProtector: IExecDataProtector;
  let wallet: HDNodeWallet;
  let provider: JsonRpcProvider;

  beforeAll(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtector(...getTestConfig(wallet.privateKey));
    provider = new JsonRpcProvider(
      process.env.DRONE ? 'http://bellecour-fork:8545' : 'http://127.0.0.1:8545'
    );
  });

  describe('When calling withdraw()', () => {
    it(
      'should work',
      async () => {
        const subscriptionPrice = 2;
        await anvilSetBalance(provider, wallet.address, subscriptionPrice);
        const { collectionTokenId } =
          await dataProtector.sharing.createCollection();

        const subscriptionParams = { priceInNRLC: 0, durationInSeconds: 2000 };
        await dataProtector.sharing.setSubscriptionParams({
          collectionTokenId,
          priceInNRLC: subscriptionPrice,
          durationInSeconds: 2000,
        });

        await dataProtector.sharing.subscribe({
          collectionTokenId,
          duration: subscriptionParams.durationInSeconds,
        });
        expect(Number(await provider.getBalance(wallet.address))).toEqual(0);
        await dataProtector.sharing.withdraw();

        expect(Number(await provider.getBalance(wallet.address))).toEqual(
          subscriptionPrice
        );
      },
      timeouts.createCollection +
        timeouts.setSubscriptionParams +
        timeouts.subscribe
    );
  });
});
