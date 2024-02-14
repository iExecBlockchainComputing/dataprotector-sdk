import { beforeAll, describe, expect, it } from '@jest/globals';
import { type HDNodeWallet, Wallet } from 'ethers';
import { ValidationError } from 'yup';
import { getProtectedDataById } from '../../../src/dataProtector/sharing/subgraph/getProtectedDataById.js';
import { getWeb3Provider, IExecDataProtector } from '../../../src/index.js';
import {
  MAX_EXPECTED_BLOCKTIME,
  MAX_EXPECTED_WEB2_SERVICES_TIME,
  SMART_CONTRACT_CALL_TIMEOUT,
  SUBGRAPH_CALL_TIMEOUT,
  WAIT_FOR_SUBGRAPH_INDEXING,
  waitForSubgraphIndexing,
} from '../../test-utils.js';

describe('dataProtector.setProtectedDataForSale()', () => {
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
      name: 'test setProtectedDataForSale()',
    });
    protectedDataAddress = address;

    await dataProtector.addToCollection({
      collectionTokenId,
      protectedDataAddress,
    });
  }, 3 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME);

  describe('When the given protected data address is not a valid address', () => {
    it('should throw with the corresponding error', async () => {
      // --- GIVEN
      const invalidProtectedDataAddress = '0x123...';

      // --- WHEN / THEN
      await expect(
        dataProtector.setProtectedDataForSale({
          protectedDataAddress: invalidProtectedDataAddress,
          priceInNRLC: 1,
        })
      ).rejects.toThrow(
        new ValidationError(
          'protectedDataAddress should be an ethereum address'
        )
      );
    });
  });

  describe('When the given price is not a valid positive number', () => {
    it('should throw with the corresponding error', async () => {
      // --- GIVEN
      const invalidPriceInNRLC = -2;

      // --- WHEN / THEN
      await expect(
        dataProtector.setProtectedDataForSale({
          protectedDataAddress: '0xbb673ac41acfbee381fe2e784d14c53b1cdc5946',
          priceInNRLC: invalidPriceInNRLC,
        })
      ).rejects.toThrow(
        new ValidationError('priceInNRLC must be greater than or equal to 0')
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
        dataProtector.setProtectedDataForSale({
          protectedDataAddress: protectedDataAddressThatDoesNotExist,
          priceInNRLC: 1,
        })
      ).rejects.toThrow(
        new Error('This protected data does not exist in the subgraph.')
      );
    });
  });

  describe('When all prerequisites are met', () => {
    it(
      'should correctly set the protected data for sale',
      async () => {
        // --- WHEN
        const setProtectedDataForSaleResult =
          await dataProtector.setProtectedDataForSale({
            protectedDataAddress,
            priceInNRLC: 1,
          });

        // --- THEN
        expect(setProtectedDataForSaleResult).toEqual({
          success: true,
          txHash: expect.any(String),
        });

        await waitForSubgraphIndexing();

        const protectedData = await getProtectedDataById({
          // @ts-expect-error graphQLClient is private but that's fine for tests
          graphQLClient: dataProtector.graphQLClient,
          protectedDataAddress,
        });
        expect(protectedData.isForSale).toBe(true);
      },
      SUBGRAPH_CALL_TIMEOUT +
        SMART_CONTRACT_CALL_TIMEOUT +
        WAIT_FOR_SUBGRAPH_INDEXING
    );
  });
});
