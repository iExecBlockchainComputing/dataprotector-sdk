import { beforeAll, describe, expect, it } from '@jest/globals';
import { Wallet, type HDNodeWallet } from 'ethers';
import { getProtectedDataById } from '../../../src/dataProtector/sharing/subgraph/getProtectedDataById.js';
import { IExecDataProtector, getWeb3Provider } from '../../../src/index.js';
import { timeouts, waitForSubgraphIndexing } from '../../test-utils.js';

describe('dataProtector.buyProtectedData()', () => {
  let dataProtector: IExecDataProtector;
  let wallet: HDNodeWallet;
  let collectionTokenId: number;

  beforeAll(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtector(getWeb3Provider(wallet.privateKey));

    const createCollectionResult = await dataProtector.createCollection();
    collectionTokenId = createCollectionResult.collectionTokenId;
  }, timeouts.createCollection);

  describe('When calling buyProtectedData() without a collectionTokenIdTo', () => {
    it(
      'should answer with success true and transfer ownership',
      async () => {
        const result = await dataProtector.protectData({
          name: 'test',
          data: { doNotUse: 'test buyProtectedData' },
        });

        //add Protected Data To Collection
        await dataProtector.addToCollection({
          protectedDataAddress: result.address,
          collectionTokenId,
        });
        await waitForSubgraphIndexing();

        const price = 0;
        await dataProtector.setProtectedDataForSale({
          protectedDataAddress: result.address,
          priceInNRLC: price,
        });
        await waitForSubgraphIndexing();

        // --- WHEN
        const { success } = await dataProtector.buyProtectedData({
          protectedDataAddress: result.address,
        });

        // --- THEN
        expect(success).toBe(true);

        await waitForSubgraphIndexing();
        const { protectedData } = await getProtectedDataById({
          // @ts-expect-error graphQLClient is private but that's fine for tests
          graphQLClient: dataProtector.graphQLClient,
          protectedDataAddress: result.address,
        });
        expect(protectedData).toBeDefined();
        const userAddress = await wallet.getAddress();
        expect(protectedData.owner.id).toBe(userAddress.toLowerCase());
      },
      timeouts.protectData +
        timeouts.addToCollection +
        timeouts.setProtectedDataForSale +
        timeouts.buyProtectedData
    );
  });
});
