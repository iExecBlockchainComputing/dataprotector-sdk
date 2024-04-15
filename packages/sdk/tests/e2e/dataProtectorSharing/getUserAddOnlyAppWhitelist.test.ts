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
        await dataProtector.sharing.createAddOnlyAppWhitelist();
        await dataProtector.sharing.createAddOnlyAppWhitelist();
        await waitForSubgraphIndexing();

        const response =
          await dataProtector.sharing.getUserAddOnlyAppWhitelist();

        expect(response.addOnlyAppWhitelists.length).toBe(2);
      },
      2 * timeouts.createAddOnlyAppWhitelist + timeouts.getUserAppWhitelist
    );
  });

  describe('When calling getUserAppWhitelist() with user', () => {
    it(
      'should work',
      async () => {
        await dataProtector2.sharing.createAddOnlyAppWhitelist();
        await dataProtector2.sharing.createAddOnlyAppWhitelist();
        await waitForSubgraphIndexing();

        const response =
          await dataProtector2.sharing.getUserAddOnlyAppWhitelist({
            user: wallet2.address,
          });

        expect(response.addOnlyAppWhitelists.length).toBe(2);
      },
      2 * timeouts.createAddOnlyAppWhitelist + timeouts.getUserAppWhitelist
    );
  });
});
