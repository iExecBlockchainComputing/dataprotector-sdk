import { beforeAll, describe, expect, it } from '@jest/globals';
import { Wallet, type HDNodeWallet } from 'ethers';
import { IExecDataProtector } from '../../../src/index.js';
import { getTestConfig, timeouts } from '../../test-utils.js';
import { waitForSubgraphIndexing } from '../../utils/waitForSubgraphIndexing.js';

describe('dataProtector.getCollectionsByOwner()', () => {
  let dataProtector: IExecDataProtector;
  let wallet: HDNodeWallet;

  beforeAll(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtector(...getTestConfig(wallet.privateKey));
  });

  describe('When calling getCollectionsByOwner()', () => {
    it(
      'should work',
      async () => {
        // --- GIVEN
        await dataProtector.sharing.createCollection();

        await waitForSubgraphIndexing();

        // --- WHEN
        const collections = await dataProtector.sharing.getCollectionsByOwner({
          owner: wallet.address,
        });

        // --- THEN
        expect(collections.collections.length).toBe(1);
      },
      timeouts.createCollection
    );
  });
});
