import { beforeAll, describe, expect, it } from '@jest/globals';
import { Wallet, type HDNodeWallet } from 'ethers';
import { ValidationError } from 'yup';
import { IExecDataProtector } from '../../../src/index.js';
import { getTestConfig, timeouts } from '../../test-utils.js';
import { waitForSubgraphIndexing } from '../../unit/utils/waitForSubgraphIndexing.js';

describe('dataProtector.removeProtectedDataFromSubscription()', () => {
  let dataProtector: IExecDataProtector;
  let wallet: HDNodeWallet;
  let collectionTokenId: number;
  let protectedDataAddress: string;

  beforeAll(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtector(...getTestConfig(wallet.privateKey));

    const createCollectionResult =
      await dataProtector.sharing.createCollection();
    collectionTokenId = createCollectionResult.collectionTokenId;

    const { address } = await dataProtector.core.protectData({
      data: { doNotUse: 'test' },
      name: 'test removeProtectedDataFromSubscription()',
    });
    protectedDataAddress = address;
    await waitForSubgraphIndexing();

    await dataProtector.sharing.addToCollection({
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
        dataProtector.sharing.removeProtectedDataFromSubscription({
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
    it('should fail if the protected data is not a part of a collection', async () => {
      // --- GIVEN
      const protectedDataAddressThatDoesNotExist =
        '0xbb673ac41acfbee381fe2e784d14c53b1cdc5946';

      // --- WHEN / THEN
      await expect(
        dataProtector.sharing.removeProtectedDataFromSubscription({
          protectedDataAddress: protectedDataAddressThatDoesNotExist,
        })
      ).rejects.toThrow(
        new Error(
          `The protected data is not a part of a collection: ${protectedDataAddressThatDoesNotExist}`
        )
      );
    });
  });

  describe('When the given protected data is not currently in subscription', () => {
    it('should throw an error', async () => {
      await expect(
        dataProtector.sharing.removeProtectedDataFromSubscription({
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
        await dataProtector.sharing.setProtectedDataToSubscription({
          protectedDataAddress,
        });

        // --- WHEN
        const removeProtectedDataFormSubscriptionResult =
          await dataProtector.sharing.removeProtectedDataFromSubscription({
            protectedDataAddress,
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
