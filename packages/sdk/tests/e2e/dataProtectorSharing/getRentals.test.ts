import { beforeAll, describe } from '@jest/globals';
import { type HDNodeWallet, Wallet } from 'ethers';
import { Address } from 'iexec';
import {
  IExecDataProtectorCore,
  IExecDataProtectorSharing,
} from '../../../src/index.js';
import { getTestConfig, timeouts } from '../../test-utils.js';
import { waitForSubgraphIndexing } from '../../utils/waitForSubgraphIndexing.js';

describe('dataProtectorSharing.getRentals()', () => {
  let wallet: HDNodeWallet;
  let dataProtectorCore: IExecDataProtectorCore;
  let dataProtectorSharing: IExecDataProtectorSharing;
  let collectionId: number;
  let protectedData1: Address;
  let protectedData2: Address;

  beforeAll(async () => {
    wallet = Wallet.createRandom();
    dataProtectorCore = new IExecDataProtectorCore(
      ...getTestConfig(wallet.privateKey)
    );
    dataProtectorSharing = new IExecDataProtectorSharing(
      ...getTestConfig(wallet.privateKey)
    );
    const createCollectionResult =
      await dataProtectorSharing.createCollection();
    collectionId = createCollectionResult.collectionId;

    const addOnlyAppWhitelistResponse =
      await dataProtectorSharing.createAddOnlyAppWhitelist();
    const addOnlyAppWhitelist = addOnlyAppWhitelistResponse.addOnlyAppWhitelist;

    ({ address: protectedData1 } = await dataProtectorCore.protectData({
      data: { doNotUse: 'test' },
      name: 'test sharing getRentals',
    }));
    await dataProtectorSharing.addToCollection({
      protectedData: protectedData1,
      addOnlyAppWhitelist,
      collectionId,
    });

    ({ address: protectedData2 } = await dataProtectorCore.protectData({
      data: { doNotUse: 'test' },
      name: 'test sharing getRentals',
    }));
    await dataProtectorSharing.addToCollection({
      protectedData: protectedData2,
      addOnlyAppWhitelist,
      collectionId,
    });

    // Expire in 1 seconds -> Will act as a past rental
    const rentingParams1 = { price: 0, duration: 1 };
    await dataProtectorSharing.setProtectedDataToRenting({
      protectedData: protectedData1,
      ...rentingParams1,
    });
    const rentingParams2 = { price: 0, duration: 60 * 60 * 24 * 5 };
    await dataProtectorSharing.setProtectedDataToRenting({
      protectedData: protectedData2,
      ...rentingParams2,
    });
    await dataProtectorSharing.rentProtectedData({
      protectedData: protectedData1,
      ...rentingParams1,
    });
    await dataProtectorSharing.rentProtectedData({
      protectedData: protectedData2,
      ...rentingParams2,
    });
    await waitForSubgraphIndexing();
  }, timeouts.createCollection + timeouts.protectData * 2 + timeouts.addToCollection * 2 + timeouts.setProtectedDataToRenting * 2 + timeouts.rentProtectedData * 2);

  describe('When I want rentals for one protected data', () => {
    it('should not return past rental', async () => {
      // --- WHEN
      const { rentals } = await dataProtectorSharing.getRentals({
        protectedData: protectedData1,
      });
      // --- THEN
      expect(rentals.length).toBe(0);
    });
    it('should return active rental', async () => {
      // --- WHEN
      const { rentals } = await dataProtectorSharing.getRentals({
        protectedData: protectedData2,
      });
      // --- THEN
      expect(rentals.length).toBe(1);
    });
  });

  describe('When I want all rentals (past and active) for one user', () => {
    it('should return two rentals', async () => {
      // --- WHEN
      const { rentals } = await dataProtectorSharing.getRentals({
        renterAddress: wallet.address,
        includePastRentals: true,
      });
      // --- THEN
      expect(rentals.length).toBe(2);
    });
  });

  describe('When I want only still active rentals for one user', () => {
    it('should return just one rental', async () => {
      // --- WHEN
      const { rentals } = await dataProtectorSharing.getRentals({
        renterAddress: wallet.address,
      });
      // --- THEN
      expect(rentals.length).toBe(1);
    });
  });
});
