import { beforeAll, describe, expect, it } from '@jest/globals';
import { type HDNodeWallet, Wallet } from 'ethers';
import { ValidationError } from 'yup';
import { getWeb3Provider, IExecDataProtector } from '../../../src/index.js';
import { getProtectedDataById } from '../../../src/lib/dataProtectorSharing/subgraph/getProtectedDataById.js';
import { waitForSubgraphIndexing } from '../../../src/lib/utils/waitForSubgraphIndexing.js';
import { timeouts } from '../../test-utils.js';

describe('dataProtector.removeProtectedDataFromSubscription()', () => {
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
      name: 'test removeProtectedDataFromSubscription()',
    });
    protectedDataAddress = address;
    await waitForSubgraphIndexing();

    await dataProtector.dataProtectorSharing.addToCollection({
      collectionTokenId,
      protectedDataAddress,
    });
  }, timeouts.createCollection + timeouts.protectData + timeouts.addToCollection);

  describe('When the given protected data address is not a valid address', () => {
    it('should throw with the corresponding error', async () => {
      // --- GIVEN
      const invalidProtectedDataAddress = '0x123...';

      // --- WHEN / THEN
      await expect(
        dataProtector.dataProtectorSharing.removeProtectedDataFromSubscription({
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
        dataProtector.dataProtectorSharing.removeProtectedDataFromSubscription({
          protectedDataAddress: protectedDataAddressThatDoesNotExist,
        })
      ).rejects.toThrow(
        new Error('This protected data does not exist in the subgraph.')
      );
    });
  });

  describe('When the given protected data is not currently in subscription', () => {
    it('should throw an error', async () => {
      await expect(
        dataProtector.dataProtectorSharing.removeProtectedDataFromSubscription({
          protectedDataAddress,
        })
      ).rejects.toThrow(
        new Error('This protected data is not included in subscription.')
      );
    });
  });

  describe('When all prerequisites are met', () => {
    it(
      'should correctly remove the protected data from subscription',
      async () => {
        // --- GIVEN
        await dataProtector.dataProtectorSharing.setProtectedDataToSubscription(
          {
            protectedDataAddress,
          }
        );

        // --- WHEN
        const removeProtectedDataFormSubscriptionResult =
          await dataProtector.dataProtectorSharing.removeProtectedDataFromSubscription(
            {
              protectedDataAddress,
            }
          );

        // --- THEN
        expect(removeProtectedDataFormSubscriptionResult).toEqual({
          success: true,
          txHash: expect.any(String),
        });

        const { protectedData } = await getProtectedDataById({
          // @ts-expect-error graphQLClient is private but that's fine for tests
          graphQLClient: dataProtector.graphQLClient,
          protectedDataAddress,
        });
        expect(protectedData.isIncludedInSubscription).toBe(false);
      },
      timeouts.setProtectedDataToSubscription +
        timeouts.removeProtectedDataFromSubscription +
        timeouts.getProtectedDataById
    );
  });
});
