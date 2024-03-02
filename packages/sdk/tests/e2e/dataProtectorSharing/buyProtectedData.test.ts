import { beforeAll, describe, expect, it } from '@jest/globals';
import { type HDNodeWallet, Wallet } from 'ethers';
import { getWeb3Provider, IExecDataProtector } from '../../../src/index.js';
import { timeouts } from '../../test-utils.js';

describe('dataProtector.buyProtectedData()', () => {
  let seller: HDNodeWallet;
  let buyer: HDNodeWallet;
  let dataProtectorForSeller: IExecDataProtector;
  let dataProtectorForBuyer: IExecDataProtector;
  let sellerCollectionTokenId: number;
  let buyerCollectionTokenId: number;

  beforeAll(async () => {
    seller = Wallet.createRandom();
    dataProtectorForSeller = new IExecDataProtector(
      getWeb3Provider(seller.privateKey)
    );

    buyer = Wallet.createRandom();
    dataProtectorForBuyer = new IExecDataProtector(
      getWeb3Provider(buyer.privateKey)
    );

    const createCollectionResult1 =
      await dataProtectorForSeller.dataProtectorSharing.createCollection();
    sellerCollectionTokenId = createCollectionResult1.collectionTokenId;

    const createCollectionResult2 =
      await dataProtectorForBuyer.dataProtectorSharing.createCollection();
    buyerCollectionTokenId = createCollectionResult2.collectionTokenId;
  }, 2 * timeouts.createCollection);

  describe('When calling buyProtectedData() WITHOUT a collectionTokenIdTo', () => {
    it(
      'should answer with success true and transfer ownership',
      async () => {
        const result = await dataProtectorForSeller.dataProtector.protectData({
          name: 'test',
          data: { doNotUse: 'test buyProtectedData' },
        });
        await dataProtectorForSeller.dataProtectorSharing.addToCollection({
          protectedDataAddress: result.address,
          collectionTokenId: sellerCollectionTokenId,
        });

        const price = 0;
        await dataProtectorForSeller.dataProtectorSharing.setProtectedDataForSale(
          {
            protectedDataAddress: result.address,
            priceInNRLC: price,
          }
        );

        // --- WHEN
        const { success } =
          await dataProtectorForBuyer.dataProtectorSharing.buyProtectedData({
            protectedDataAddress: result.address,
          });

        // --- THEN
        expect(success).toBe(true);
      },
      timeouts.protectData +
        timeouts.addToCollection +
        timeouts.setProtectedDataForSale +
        timeouts.buyProtectedData
    );
  });

  describe('When calling buyProtectedData() WITH a collectionTokenIdTo', () => {
    it(
      "should answer with success true and add it to new owner's collection",
      async () => {
        const result = await dataProtectorForSeller.dataProtector.protectData({
          name: 'test',
          data: { doNotUse: 'test buyProtectedData' },
        });

        await dataProtectorForSeller.dataProtectorSharing.addToCollection({
          protectedDataAddress: result.address,
          collectionTokenId: sellerCollectionTokenId,
        });

        const price = 0;
        await dataProtectorForSeller.dataProtectorSharing.setProtectedDataForSale(
          {
            protectedDataAddress: result.address,
            priceInNRLC: price,
          }
        );

        // --- WHEN
        const { success } =
          await dataProtectorForBuyer.dataProtectorSharing.buyProtectedData({
            protectedDataAddress: result.address,
            collectionTokenIdTo: buyerCollectionTokenId,
          });

        // --- THEN
        expect(success).toBe(true);
      },
      timeouts.protectData +
        timeouts.addToCollection +
        timeouts.setProtectedDataForSale +
        timeouts.buyProtectedData
    );
  });
});
