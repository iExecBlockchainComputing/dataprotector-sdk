import { beforeAll, describe, expect, it } from '@jest/globals';
import { Wallet, type HDNodeWallet } from 'ethers';
import { ValidationError } from 'yup';
import { IExecDataProtector } from '../../../src/index.js';
import { getTestConfig, timeouts } from '../../test-utils.js';

describe('dataProtector.removeProtectedDataForSale()', () => {
  let dataProtector: IExecDataProtector;
  let wallet: HDNodeWallet;
  let collectionTokenId: number;
  let protectedData: string;

  beforeAll(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtector(...getTestConfig(wallet.privateKey));

    const createCollectionResult =
      await dataProtector.sharing.createCollection();
    collectionTokenId = createCollectionResult.collectionTokenId;

    const { address } = await dataProtector.core.protectData({
      data: { doNotUse: 'test' },
      name: 'test removeProtectedDataForSale()',
    });
    protectedData = address;

    await dataProtector.sharing.addToCollection({
      collectionTokenId,
      protectedData,
    });
  }, timeouts.createCollection + timeouts.protectData + timeouts.addToCollection);

  describe('When the given protected data address is not a valid address', () => {
    it('should throw with the corresponding error', async () => {
      // --- GIVEN
      const invalidProtectedData = '0x123...';

      // --- WHEN / THEN
      await expect(
        dataProtector.sharing.removeProtectedDataForSale({
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
        dataProtector.sharing.removeProtectedDataForSale({
          protectedData: protectedDataThatDoesNotExist,
        })
      ).rejects.toThrow(
        new Error(
          `The protected data is not a part of a collection: ${protectedDataThatDoesNotExist}`
        )
      );
    });
  });

  describe('When the given protected data is not currently for sale', () => {
    it('should throw an error', async () => {
      await expect(
        dataProtector.sharing.removeProtectedDataForSale({
          protectedData,
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
        await dataProtector.sharing.setProtectedDataForSale({
          protectedData,
          priceInNRLC: 1,
        });

        // --- WHEN
        const removeProtectedDataForSaleResult =
          await dataProtector.sharing.removeProtectedDataForSale({
            protectedData,
          });

        // --- THEN
        expect(removeProtectedDataForSaleResult).toEqual({
          txHash: expect.any(String),
        });
      },
      timeouts.setProtectedDataForSale +
        timeouts.removeProtectedDataForSale +
        timeouts.getProtectedDataById
    );
  });
});
