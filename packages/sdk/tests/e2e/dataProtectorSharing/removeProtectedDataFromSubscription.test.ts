import { beforeAll, describe, expect, it } from '@jest/globals';
import { Wallet, type HDNodeWallet } from 'ethers';
import { ValidationError } from 'yup';
import { IExecDataProtector } from '../../../src/index.js';
import { getTestConfig, timeouts } from '../../test-utils.js';
import { waitForSubgraphIndexing } from '../../unit/utils/waitForSubgraphIndexing.js';

describe('dataProtector.removeProtectedDataFromSubscription()', () => {
  let dataProtector: IExecDataProtector;
  let wallet: HDNodeWallet;
  let collectionId: number;
  let protectedData: string;
  let addOnlyAppWhitelist: string;

  beforeAll(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtector(...getTestConfig(wallet.privateKey));

    const createCollectionResult =
      await dataProtector.sharing.createCollection();
    collectionId = createCollectionResult.collectionId;
    const addOnlyAppWhitelistResponse =
      await dataProtector.sharing.createAddOnlyAppWhitelist();
    addOnlyAppWhitelist = addOnlyAppWhitelistResponse.addOnlyAppWhitelist;

    const { address } = await dataProtector.core.protectData({
      data: { doNotUse: 'test' },
      name: 'test removeProtectedDataFromSubscription()',
    });
    protectedData = address;
    await waitForSubgraphIndexing();

    await dataProtector.sharing.addToCollection({
      collectionId,
      addOnlyAppWhitelist,
      protectedData,
    });
  }, timeouts.createCollection + timeouts.protectData + timeouts.addToCollection);

  describe('When the given protected data address is not a valid address', () => {
    it('should throw with the corresponding error', async () => {
      // --- GIVEN
      const invalidProtectedData = '0x123...';

      // --- WHEN / THEN
      await expect(
        dataProtector.sharing.removeProtectedDataFromSubscription({
          protectedData: invalidProtectedData,
        })
      ).rejects.toThrow(
        new ValidationError(
          'protectedData should be an ethereum address or a ENS name'
        )
      );
    });
  });

  describe('When the given protected data does NOT exist', () => {
    it('should fail if the protected data is not a part of a collection', async () => {
      // --- GIVEN
      const protectedDataThatDoesNotExist =
        '0xbb673ac41acfbee381fe2e784d14c53b1cdc5946';

      // --- WHEN / THEN
      await expect(
        dataProtector.sharing.removeProtectedDataFromSubscription({
          protectedData: protectedDataThatDoesNotExist,
        })
      ).rejects.toThrow(
        new Error(
          `The protected data is not a part of a collection: ${protectedDataThatDoesNotExist}`
        )
      );
    });
  });

  describe('When the given protected data is not currently in subscription', () => {
    it('should throw an error', async () => {
      await expect(
        dataProtector.sharing.removeProtectedDataFromSubscription({
          protectedData,
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
        await dataProtector.sharing.setProtectedDataToSubscription({
          protectedData,
        });

        // --- WHEN
        const removeProtectedDataFormSubscriptionResult =
          await dataProtector.sharing.removeProtectedDataFromSubscription({
            protectedData,
          });

        // --- THEN
        expect(removeProtectedDataFormSubscriptionResult).toEqual({
          txHash: expect.any(String),
        });
      },
      timeouts.setProtectedDataToSubscription +
        timeouts.removeProtectedDataFromSubscription +
        timeouts.getProtectedDataById
    );
  });
});
