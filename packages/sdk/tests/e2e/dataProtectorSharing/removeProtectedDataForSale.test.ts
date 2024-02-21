import { beforeAll, describe, expect, it } from '@jest/globals';
import { type HDNodeWallet, Wallet } from 'ethers';
import { ValidationError } from 'yup';
import { getWeb3Provider, IExecDataProtector } from '../../../src/index.js';
import { getProtectedDataById } from '../../../src/lib/dataProtectorSharing/subgraph/getProtectedDataById.js';
import {
  MAX_EXPECTED_BLOCKTIME,
  MAX_EXPECTED_WEB2_SERVICES_TIME,
  SMART_CONTRACT_CALL_TIMEOUT,
  SUBGRAPH_CALL_TIMEOUT,
  WAIT_FOR_SUBGRAPH_INDEXING,
  waitForSubgraphIndexing,
} from '../../test-utils.js';

describe('dataProtector.removeProtectedDataForSale()', () => {
  let dataProtector: IExecDataProtector;
  let wallet: HDNodeWallet;
  let collectionTokenId: number;
  let protectedDataAddress: string;

  beforeAll(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtector(getWeb3Provider(wallet.privateKey));

    const createCollectionResult =
      await dataProtector.dataProtectorSharing.createCollection();
    collectionTokenId = createCollectionResult.collectionTokenId;

    const { address } = await dataProtector.dataProtector.protectData({
      data: { doNotUse: 'test' },
      name: 'test removeProtectedDataForSale()',
    });
    protectedDataAddress = address;
    await waitForSubgraphIndexing();

    await dataProtector.dataProtectorSharing.addToCollection({
      collectionTokenId,
      protectedDataAddress,
    });
    await waitForSubgraphIndexing();
  }, 3 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME);

  describe('When the given protected data address is not a valid address', () => {
    it('should throw with the corresponding error', async () => {
      // --- GIVEN
      const invalidProtectedDataAddress = '0x123...';

      // --- WHEN / THEN
      await expect(
        dataProtector.dataProtectorSharing.removeProtectedDataForSale({
          protectedDataAddress: invalidProtectedDataAddress,
        })
      ).rejects.toThrow(
        new ValidationError(
          'protectedDataAddress should be an ethereum address, a ENS name, or "any"'
        )
      );
    });
  });

  describe('When the given protected data does NOT exist', () => {
    it('should throw an error', async () => {
      // --- GIVEN
      const protectedDataAddressThatDoesNotExist =
        '0xbb673ac41acfbee381fe2e784d14c53b1cdc5946';

      // --- WHEN / THEN
      await expect(
        dataProtector.dataProtectorSharing.removeProtectedDataForSale({
          protectedDataAddress: protectedDataAddressThatDoesNotExist,
        })
      ).rejects.toThrow(
        new Error('This protected data does not exist in the subgraph.')
      );
    });
  });

  describe('When the given protected data is not currently for sale', () => {
    it('should throw an error', async () => {
      await expect(
        dataProtector.dataProtectorSharing.removeProtectedDataForSale({
          protectedDataAddress,
        })
      ).rejects.toThrow(
        new Error('This protected data is currently not for sale.')
      );
    });
  });

  describe('When all prerequisites are met', () => {
    it(
      'should correctly remove the protected data for sale',
      async () => {
        // --- GIVEN
        await dataProtector.dataProtectorSharing.setProtectedDataForSale({
          protectedDataAddress,
          priceInNRLC: 1,
        });
        await waitForSubgraphIndexing();

        // --- WHEN
        const removeProtectedDataForSaleResult =
          await dataProtector.dataProtectorSharing.removeProtectedDataForSale({
            protectedDataAddress,
          });

        // --- THEN
        expect(removeProtectedDataForSaleResult).toEqual({
          success: true,
          txHash: expect.any(String),
        });

        await waitForSubgraphIndexing();

        const { protectedData } = await getProtectedDataById({
          // @ts-expect-error graphQLClient is private but that's fine for tests
          graphQLClient: dataProtector.graphQLClient,
          protectedDataAddress,
        });
        expect(protectedData.isForSale).toBe(false);
      },
      2 * SUBGRAPH_CALL_TIMEOUT +
        2 * SMART_CONTRACT_CALL_TIMEOUT +
        2 * WAIT_FOR_SUBGRAPH_INDEXING
    );
  });
});
