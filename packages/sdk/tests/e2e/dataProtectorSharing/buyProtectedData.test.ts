import { beforeAll, describe, expect, it } from '@jest/globals';
import { type HDNodeWallet, Wallet } from 'ethers';
import { DEFAULT_SHARING_CONTRACT_ADDRESS } from '../../../src/config/config.js';
import { getWeb3Provider, IExecDataProtector } from '../../../src/index.js';
import { getProtectedDataById } from '../../../src/lib/dataProtectorSharing/subgraph/getProtectedDataById.js';
import { waitForSubgraphIndexing } from '../../../src/lib/utils/waitForSubgraphIndexing.js';
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

        const { protectedData } = await getProtectedDataById({
          // @ts-expect-error graphQLClient is private but that's fine for tests
          graphQLClient: dataProtectorForSeller.graphQLClient,
          protectedDataAddress: result.address,
        });
        expect(protectedData).toBeDefined();
        const buyerAddress = await buyer.getAddress();
        expect(protectedData.owner.id).toBe(buyerAddress.toLowerCase());
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
        await waitForSubgraphIndexing();

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

        const { protectedData } = await getProtectedDataById({
          // @ts-expect-error graphQLClient is private but that's fine for tests
          graphQLClient: dataProtectorForSeller.graphQLClient,
          protectedDataAddress: result.address,
        });
        expect(protectedData).toBeDefined();
        // Sharing smart-contract should still be the owner
        expect(protectedData.owner.id).toBe(DEFAULT_SHARING_CONTRACT_ADDRESS);
        expect(Number(protectedData.collection.id)).toBe(
          buyerCollectionTokenId
        );
      },
      timeouts.protectData +
        timeouts.addToCollection +
        timeouts.setProtectedDataForSale +
        timeouts.buyProtectedData
    );
  });
});
