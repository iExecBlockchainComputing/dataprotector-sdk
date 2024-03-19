import { HDNodeWallet, Wallet } from 'ethers';
import { IExecDataProtector } from '../../../src/index.js';
import { getTestConfig } from '../../test-utils.js';
import { waitForSubgraphIndexing } from '../../unit/utils/waitForSubgraphIndexing.js';

// waiting for merge and new subgraph deployment
describe.skip('dataProtector.getUserAppWhitelist()', () => {
  let dataProtector: IExecDataProtector;
  let wallet: HDNodeWallet;

  beforeAll(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtector(...getTestConfig(wallet.privateKey));
  });

  describe('When calling getSubscribers()', () => {
    it('should work', async () => {
      await dataProtector.sharing.createAppWhitelist();
      await dataProtector.sharing.createAppWhitelist();
      await waitForSubgraphIndexing();

      const response = await dataProtector.sharing.getUserAppWhitelist();

      expect(response.appWhitelists.length).toBe(2);
    });
  });

  describe('When calling getSubscribers() with user', () => {
    it('should work', async () => {
      await dataProtector.sharing.createAppWhitelist();
      await dataProtector.sharing.createAppWhitelist();
      await waitForSubgraphIndexing();

      const response = await dataProtector.sharing.getUserAppWhitelist({
        user: wallet.address,
      });

      expect(response.appWhitelists.length).toBe(2);
    });
  });
});
