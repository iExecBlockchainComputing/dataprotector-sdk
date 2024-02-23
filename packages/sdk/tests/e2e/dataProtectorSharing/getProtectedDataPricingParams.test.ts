import { beforeAll, describe } from '@jest/globals';
import { type HDNodeWallet, Wallet } from 'ethers';
import {
  DataProtector,
  DataProtectorSharing,
  getWeb3Provider,
} from '../../../src/index.js';
import { timeouts } from '../../test-utils.js';

describe('dataProtector.getProtectedDataPricingParams()', () => {
  let dataProtector: DataProtector;
  let dataProtectorSharing: DataProtectorSharing;
  let wallet: HDNodeWallet;
  let collectionTokenId: number;
  let protectedDataAddress: string;

  beforeAll(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new DataProtector(getWeb3Provider(wallet.privateKey));
    dataProtectorSharing = new DataProtectorSharing(
      getWeb3Provider(wallet.privateKey)
    );

    const createCollectionResult =
      await dataProtectorSharing.createCollection();
    collectionTokenId = createCollectionResult.collectionTokenId;

    const { address } = await dataProtector.protectData({
      data: { doNotUse: 'test' },
      name: 'test addToCollection',
    });
    protectedDataAddress = address;

    await dataProtectorSharing.addToCollection({
      collectionTokenId,
      protectedDataAddress,
    });
  }, timeouts.createCollection + timeouts.protectData + timeouts.addToCollection);

  describe.skip('When the protected data is rentable and its rental price is 0', () => {
    it(
      'should return isFree: true',
      async () => {
        // --- GIVEN
        await dataProtectorSharing.setProtectedDataToRenting({
          protectedDataAddress,
          priceInNRLC: 0,
          durationInSeconds: 60 * 60 * 24 * 5, // 5 days
        });

        // --- WHEN
        const pricingParams =
          await dataProtectorSharing.getProtectedDataPricingParams({
            protectedDataAddress,
          });

        // --- THEN
        expect(pricingParams.isFree).toBe(true);
        expect(pricingParams.isRentable).toBe(false);
        expect(pricingParams.isIncludedInSubscription).toBe(false);
        expect(pricingParams.isForSale).toBe(false);
      },
      timeouts.setProtectedDataToRenting +
        timeouts.getProtectedDataPricingParams
    );
  });

  describe('When the protected data is for rent', () => {
    it(
      'should return isRentable: true',
      async () => {
        // --- GIVEN
        // TODO: Have a method to directly change renting price?
        await dataProtectorSharing.removeProtectedDataFromRenting({
          protectedDataAddress,
        });
        await dataProtectorSharing.setProtectedDataToRenting({
          protectedDataAddress,
          priceInNRLC: 2,
          durationInSeconds: 60 * 60 * 24 * 5, // 5 days
        });

        // --- WHEN
        const pricingParams =
          await dataProtectorSharing.getProtectedDataPricingParams({
            protectedDataAddress,
          });

        // --- THEN
        expect(pricingParams.isFree).toBe(false);
        expect(pricingParams.isRentable).toBe(true);
        expect(pricingParams.isIncludedInSubscription).toBe(false);
        expect(pricingParams.isForSale).toBe(false);
      },
      timeouts.removeProtectedDataFromRenting +
        timeouts.setProtectedDataToRenting +
        timeouts.getProtectedDataPricingParams
    );
  });

  describe('When the protected data is for sale', () => {
    it(
      'should return isForSale: true',
      async () => {
        // --- GIVEN
        await dataProtectorSharing.removeProtectedDataFromRenting({
          protectedDataAddress,
        });
        await dataProtectorSharing.setProtectedDataForSale({
          protectedDataAddress,
          priceInNRLC: 20,
        });

        // --- WHEN
        const pricingParams =
          await dataProtectorSharing.getProtectedDataPricingParams({
            protectedDataAddress,
          });

        // --- THEN
        expect(pricingParams.isFree).toBe(false);
        expect(pricingParams.isRentable).toBe(false);
        expect(pricingParams.isIncludedInSubscription).toBe(false);
        expect(pricingParams.isForSale).toBe(true);
      },
      timeouts.removeProtectedDataFromRenting +
        timeouts.setProtectedDataForSale +
        timeouts.getProtectedDataPricingParams
    );
  });

  describe('When the protected data is for rent AND included is subscription', () => {
    it(
      'should return isRentable: true AND isIncludedInSubscription: true',
      async () => {
        // --- GIVEN
        await dataProtectorSharing.removeProtectedDataForSale({
          protectedDataAddress,
        });
        await dataProtectorSharing.setProtectedDataToRenting({
          protectedDataAddress,
          priceInNRLC: 2,
          durationInSeconds: 60 * 60 * 24 * 5, // 5 days
        });
        await dataProtectorSharing.setProtectedDataToSubscription({
          protectedDataAddress,
        });

        // --- WHEN
        const pricingParams =
          await dataProtectorSharing.getProtectedDataPricingParams({
            protectedDataAddress,
          });

        // --- THEN
        expect(pricingParams.isFree).toBe(false);
        expect(pricingParams.isRentable).toBe(true);
        expect(pricingParams.isIncludedInSubscription).toBe(true);
        expect(pricingParams.isForSale).toBe(false);
      },
      timeouts.removeProtectedDataForSale +
        timeouts.setProtectedDataToRenting +
        timeouts.setProtectedDataToSubscription +
        timeouts.getProtectedDataPricingParams
    );
  });
});
