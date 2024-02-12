import { beforeAll, describe } from '@jest/globals';
import { type HDNodeWallet, Wallet } from 'ethers';
import { getWeb3Provider, IExecDataProtector } from '../../../src/index.js';
import { sleep } from '../../test-utils.js';

describe('dataProtector.getProtectedDataPricingParams()', () => {
  let dataProtector: IExecDataProtector;
  let wallet: HDNodeWallet;
  let collectionTokenId: number;
  let protectedDataAddress: string;

  beforeAll(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtector(getWeb3Provider(wallet.privateKey));

    const createCollectionResult = await dataProtector.createCollection();
    collectionTokenId = createCollectionResult.collectionTokenId;

    const { address } = await dataProtector.protectData({
      data: { doNotUse: 'test' },
      name: 'test addToCollection',
    });
    protectedDataAddress = address;

    await dataProtector.addToCollection({
      collectionTokenId,
      protectedDataAddress,
    });
  });

  describe('When the protected data is free', () => {
    it('should return isFree: true', async () => {
      // --- GIVEN
      await dataProtector.setProtectedDataAsFree({
        collectionTokenId,
        protectedDataAddress,
      });

      // --- WHEN
      const pricingParams = await dataProtector.getProtectedDataPricingParams({
        protectedDataAddress,
      });

      // Wait for subgraph to index corresponding event
      await sleep(2000);

      // --- THEN
      expect(pricingParams.isFree).toBe(true);
      expect(pricingParams.isRentable).toBe(false);
      expect(pricingParams.isIncludedInSubscription).toBe(false);
      expect(pricingParams.isForSale).toBe(false);
    });
  });

  describe('When the protected data is for rent', () => {
    it('should return isRentable: true', async () => {
      // --- GIVEN
      await dataProtector.setProtectedDataToRenting({
        collectionTokenId,
        protectedDataAddress,
        priceInNRLC: BigInt('2'),
        durationInSeconds: 60 * 60 * 24 * 5, // 5 days
      });

      // --- WHEN
      const pricingParams = await dataProtector.getProtectedDataPricingParams({
        protectedDataAddress,
      });

      // Wait for subgraph to index corresponding event
      await sleep(2000);

      // --- THEN
      expect(pricingParams.isFree).toBe(false);
      expect(pricingParams.isRentable).toBe(true);
      expect(pricingParams.isIncludedInSubscription).toBe(false);
      expect(pricingParams.isForSale).toBe(false);
    });
  });

  describe('When the protected data is for rent AND included is subscription', () => {
    it('should return isRentable: true AND isIncludedInSubscription: true', async () => {
      // --- GIVEN
      await dataProtector.setProtectedDataToSubscription({
        collectionTokenId,
        protectedDataAddress,
      });

      // --- WHEN
      const pricingParams = await dataProtector.getProtectedDataPricingParams({
        protectedDataAddress,
      });

      // Wait for subgraph to index corresponding event
      await sleep(2000);

      // --- THEN
      expect(pricingParams.isFree).toBe(false);
      expect(pricingParams.isRentable).toBe(true);
      expect(pricingParams.isIncludedInSubscription).toBe(true);
      expect(pricingParams.isForSale).toBe(false);
    });
  });

  describe('When the protected data is for sale', () => {
    it('should return isForSale: true', async () => {
      // --- GIVEN
      await dataProtector.removeProtectedDataFromRenting({
        collectionTokenId,
        protectedDataAddress,
      });
      await dataProtector.removeProtectedDataFromSubscription({
        collectionTokenId,
        protectedDataAddress,
      });
      await dataProtector.setProtectedDataForSale({
        collectionTokenId,
        protectedDataAddress,
      });

      // --- WHEN
      const pricingParams = await dataProtector.getProtectedDataPricingParams({
        protectedDataAddress,
      });

      // Wait for subgraph to index corresponding event
      await sleep(2000);

      // --- THEN
      expect(pricingParams.isFree).toBe(false);
      expect(pricingParams.isRentable).toBe(false);
      expect(pricingParams.isIncludedInSubscription).toBe(false);
      expect(pricingParams.isForSale).toBe(true);
    });
  });
});
