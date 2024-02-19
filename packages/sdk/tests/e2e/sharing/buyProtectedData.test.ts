import { beforeAll, describe, expect, it } from '@jest/globals';
import { Wallet, type HDNodeWallet } from 'ethers';
import { DEFAULT_SHARING_CONTRACT_ADDRESS } from '../../../src/config/config.js';
import { getProtectedDataById } from '../../../src/dataProtector/sharing/subgraph/getProtectedDataById.js';
import { IExecDataProtector, getWeb3Provider } from '../../../src/index.js';
import { timeouts, waitForSubgraphIndexing } from '../../test-utils.js';

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
      await dataProtectorForSeller.createCollection();
    sellerCollectionTokenId = createCollectionResult1.collectionTokenId;

    const createCollectionResult2 =
      await dataProtectorForBuyer.createCollection();
    buyerCollectionTokenId = createCollectionResult2.collectionTokenId;
  }, 2 * timeouts.createCollection);

  describe('When calling buyProtectedData() WITHOUT a collectionTokenIdTo', () => {
    it(
      'should answer with success true and transfer ownership',
      async () => {
        const result = await dataProtectorForSeller.protectData({
          name: 'test',
          data: { doNotUse: 'test buyProtectedData' },
        });

        await dataProtectorForSeller.addToCollection({
          protectedDataAddress: result.address,
          collectionTokenId: sellerCollectionTokenId,
        });
        await waitForSubgraphIndexing();

        const price = 0;
        await dataProtectorForSeller.setProtectedDataForSale({
          protectedDataAddress: result.address,
          priceInNRLC: price,
        });
        await waitForSubgraphIndexing();

        // --- WHEN
        const { success } = await dataProtectorForBuyer.buyProtectedData({
          protectedDataAddress: result.address,
        });

        // --- THEN
        expect(success).toBe(true);

        await waitForSubgraphIndexing();
        const { protectedData } = await getProtectedDataById({
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
        const result = await dataProtectorForSeller.protectData({
          name: 'test',
          data: { doNotUse: 'test buyProtectedData' },
        });

        await dataProtectorForSeller.addToCollection({
          protectedDataAddress: result.address,
          collectionTokenId: sellerCollectionTokenId,
        });
        await waitForSubgraphIndexing();

        const price = 0;
        await dataProtectorForSeller.setProtectedDataForSale({
          protectedDataAddress: result.address,
          priceInNRLC: price,
        });
        await waitForSubgraphIndexing();

        // --- WHEN
        const { success } = await dataProtectorForBuyer.buyProtectedData({
          protectedDataAddress: result.address,
          collectionTokenIdTo: buyerCollectionTokenId,
        });

        // --- THEN
        expect(success).toBe(true);

        await waitForSubgraphIndexing();
        const { protectedData } = await getProtectedDataById({
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
