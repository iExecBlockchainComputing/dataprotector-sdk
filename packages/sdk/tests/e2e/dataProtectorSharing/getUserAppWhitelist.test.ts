import { HDNodeWallet, Wallet } from 'ethers';
import { IExecDataProtector } from '../../../src/index.js';
import { getTestConfig, timeouts } from '../../test-utils.js';
import { waitForSubgraphIndexing } from '../../unit/utils/waitForSubgraphIndexing.js';

// waiting for merge and new subgraph deployment
describe('dataProtector.getUserAppWhitelist()', () => {
  let dataProtector: IExecDataProtector;
  let wallet: HDNodeWallet;
  let dataProtector2: IExecDataProtector;
  let wallet2: HDNodeWallet;

  beforeAll(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtector(...getTestConfig(wallet.privateKey));
    wallet2 = Wallet.createRandom();
    dataProtector2 = new IExecDataProtector(
      ...getTestConfig(wallet2.privateKey)
    );
  });

  describe('When calling getUserAppWhitelist()', () => {
    it(
      'should work',
      async () => {
        await dataProtector.sharing.createAppWhitelist();
        await dataProtector.sharing.createAppWhitelist();
        await waitForSubgraphIndexing();

        const response = await dataProtector.sharing.getUserAppWhitelist();

        expect(response.appWhitelists.length).toBe(2);
      },
      2 * timeouts.createAppWhitelist + timeouts.getUserAppWhitelist
    );
  });

  describe('When calling getUserAppWhitelist() with user', () => {
    it(
      'should work',
      async () => {
        await dataProtector2.sharing.createAppWhitelist();
        await dataProtector2.sharing.createAppWhitelist();
        await waitForSubgraphIndexing();

        const response = await dataProtector2.sharing.getUserAppWhitelist({
          user: wallet2.address,
        });

        expect(response.appWhitelists.length).toBe(2);
      },
      2 * timeouts.createAppWhitelist + timeouts.getUserAppWhitelist
    );
  });
});
