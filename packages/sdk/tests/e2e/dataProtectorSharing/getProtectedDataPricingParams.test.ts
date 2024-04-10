import { beforeAll, describe } from '@jest/globals';
import { Wallet, type HDNodeWallet } from 'ethers';
import {
  IExecDataProtectorCore,
  IExecDataProtectorSharing,
} from '../../../src/index.js';
import { getTestConfig, timeouts } from '../../test-utils.js';
import { waitForSubgraphIndexing } from '../../unit/utils/waitForSubgraphIndexing.js';

describe('dataProtector.getProtectedDataPricingParams()', () => {
  let dataProtectorCore: IExecDataProtectorCore;
  let dataProtectorSharing: IExecDataProtectorSharing;
  let wallet: HDNodeWallet;
  let collectionId: number;

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
  }, timeouts.createCollection + timeouts.protectData + timeouts.addToCollection);

  describe('When the protected data is for rent', () => {
    it(
      'should return isRentable: true',
      async () => {
        // --- GIVEN
        const { address: protectedData } = await dataProtectorCore.protectData({
          data: { doNotUse: 'test' },
          name: 'test addToCollection',
        });

        await dataProtectorSharing.addToCollection({
          collectionId,
          protectedData,
        });

        await dataProtectorSharing.setProtectedDataToRenting({
          protectedData,
          priceInNRLC: 2,
          durationInSeconds: 60 * 60 * 24 * 5, // 5 days
        });

        await waitForSubgraphIndexing();

        // --- WHEN
        const { protectedDataPricingParams } =
          await dataProtectorSharing.getProtectedDataPricingParams({
            protectedData,
          });

        // --- THEN
        expect(protectedDataPricingParams.isRentable).toBe(true);
        expect(protectedDataPricingParams.isIncludedInSubscription).toBe(false);
        expect(protectedDataPricingParams.isForSale).toBe(false);
      },
      timeouts.protectData +
        timeouts.addToCollection +
        timeouts.setProtectedDataToRenting +
        timeouts.getProtectedDataPricingParams
    );
  });

  describe('When the protected data is for sale', () => {
    it(
      'should return isForSale: true',
      async () => {
        // --- GIVEN
        const { address: protectedData } = await dataProtectorCore.protectData({
          data: { doNotUse: 'test' },
          name: 'test addToCollection',
        });

        await dataProtectorSharing.addToCollection({
          collectionId,
          protectedData,
        });

        await dataProtectorSharing.setProtectedDataForSale({
          protectedData,
          priceInNRLC: 20,
        });

        await waitForSubgraphIndexing();

        // --- WHEN
        const { protectedDataPricingParams } =
          await dataProtectorSharing.getProtectedDataPricingParams({
            protectedData,
          });

        // --- THEN
        expect(protectedDataPricingParams.isRentable).toBe(false);
        expect(protectedDataPricingParams.isIncludedInSubscription).toBe(false);
        expect(protectedDataPricingParams.isForSale).toBe(true);
      },
      timeouts.protectData +
        timeouts.addToCollection +
        timeouts.setProtectedDataToRenting +
        timeouts.getProtectedDataPricingParams
    );
  });

  describe('When the protected data is for rent AND included in subscription', () => {
    it(
      'should return isRentable: true AND isIncludedInSubscription: true',
      async () => {
        // --- GIVEN
        const { address: protectedData } = await dataProtectorCore.protectData({
          data: { doNotUse: 'test' },
          name: 'test addToCollection',
        });

        await dataProtectorSharing.addToCollection({
          collectionId,
          protectedData,
        });

        await dataProtectorSharing.setProtectedDataToRenting({
          protectedData,
          priceInNRLC: 2,
          durationInSeconds: 60 * 60 * 24 * 5, // 5 days
        });

        await dataProtectorSharing.setProtectedDataToSubscription({
          protectedData,
        });

        await waitForSubgraphIndexing();

        // --- WHEN
        const { protectedDataPricingParams } =
          await dataProtectorSharing.getProtectedDataPricingParams({
            protectedData,
          });

        // --- THEN
        expect(protectedDataPricingParams.isRentable).toBe(true);
        expect(protectedDataPricingParams.isIncludedInSubscription).toBe(true);
        expect(protectedDataPricingParams.isForSale).toBe(false);
      },
      timeouts.protectData +
        timeouts.addToCollection +
        timeouts.setProtectedDataToRenting +
        timeouts.getProtectedDataPricingParams
    );
  });

  describe('When the given protected data address is not a valid address', () => {
    it(
      'should throw with the corresponding error',
      async () => {
        // --- GIVEN
        const invalidProtectedData = '0x123...';

        // --- WHEN / THEN
        await expect(
          dataProtectorSharing.getProtectedDataPricingParams({
            protectedData: invalidProtectedData,
          })
        ).rejects.toThrow(
          new Error('protectedData should be an ethereum address or a ENS name')
        );
      },
      timeouts.getProtectedDataPricingParams
    );
  });
});
