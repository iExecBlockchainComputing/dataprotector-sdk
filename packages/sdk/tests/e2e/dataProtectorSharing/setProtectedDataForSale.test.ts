import { beforeAll, describe, expect, it } from '@jest/globals';
import { Wallet } from 'ethers';
import { ValidationError } from 'yup';
import { IExecDataProtector } from '../../../src/index.js';
import { getTestConfig, timeouts } from '../../test-utils.js';

describe('dataProtector.setProtectedDataForSale()', () => {
  let dataProtectorCreator: IExecDataProtector;
  let dataProtectorEndUser: IExecDataProtector;
  let collectionId: number;
  let protectedData: string;

  beforeAll(async () => {
    const walletCreator = Wallet.createRandom();
    const walletEndUser = Wallet.createRandom();
    dataProtectorCreator = new IExecDataProtector(
      ...getTestConfig(walletCreator.privateKey)
    );
    dataProtectorEndUser = new IExecDataProtector(
      ...getTestConfig(walletEndUser.privateKey)
    );

    const createCollectionResult =
      await dataProtectorCreator.sharing.createCollection();
    collectionId = createCollectionResult.collectionId;

    const { address } = await dataProtectorCreator.core.protectData({
      data: { doNotUse: 'test' },
      name: 'test setProtectedDataForSale()',
    });
    protectedData = address;

    await dataProtectorCreator.sharing.addToCollection({
      collectionId,
      protectedData,
    });
  }, timeouts.createCollection + timeouts.protectData + timeouts.addToCollection);

  describe('When the given protected data address is not a valid address', () => {
    it('should throw with the corresponding error', async () => {
      // --- GIVEN
      const invalidProtectedData = '0x123...';

      // --- WHEN / THEN
      await expect(
        dataProtectorCreator.sharing.setProtectedDataForSale({
          protectedData: invalidProtectedData,
          price: 1,
        })
      ).rejects.toThrow(
        new ValidationError(
          'protectedData should be an ethereum address or a ENS name'
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
        dataProtectorCreator.sharing.setProtectedDataForSale({
          protectedData: '0xbb673ac41acfbee381fe2e784d14c53b1cdc5946',
          price: invalidPriceInNRLC,
        })
      ).rejects.toThrow(
        new ValidationError('price must be greater than or equal to 0')
      );
    });
  });

  describe('should fail if the protected data is not a part of a collection', () => {
    it('should throw an error', async () => {
      // --- GIVEN
      const protectedDataThatDoesNotExist =
        '0xbb673ac41acfbee381fe2e784d14c53b1cdc5946';

      // --- WHEN / THEN
      await expect(
        dataProtectorCreator.sharing.setProtectedDataForSale({
          protectedData: protectedDataThatDoesNotExist,
          price: 1,
        })
      ).rejects.toThrow(
        new Error(
          `The protected data is not a part of a collection: ${protectedDataThatDoesNotExist}`
        )
      );
    });
  });

  describe('When the given protected data still has active rentals', () => {
    it(
      'should throw an error',
      async () => {
        // --- GIVEN
        const rentingParams = {
          price: 0,
          duration: 30 * 24 * 60 * 60,
        };
        await dataProtectorCreator.sharing.setProtectedDataToRenting({
          protectedData,
          ...rentingParams,
        });

        await dataProtectorEndUser.sharing.rentProtectedData({
          protectedData,
          ...rentingParams,
        });

        // --- WHEN / THEN
        await expect(
          dataProtectorCreator.sharing.setProtectedDataForSale({
            protectedData,
            price: 1,
          })
        ).rejects.toThrow(new Error('This protected data has active rentals.'));
      },
      timeouts.setProtectedDataToRenting +
        timeouts.rentProtectedData +
        timeouts.setProtectedDataForSale
    );
  });

  describe('When all prerequisites are met', () => {
    it(
      'should correctly set the protected data for sale',
      async () => {
        // --- GIVEN
        // Need to create a new protected data as the previous one is now rented
        const { address } = await dataProtectorCreator.core.protectData({
          data: { doNotUse: 'test' },
          name: 'test setProtectedDataForSale()',
        });
        protectedData = address;

        await dataProtectorCreator.sharing.addToCollection({
          collectionId,
          protectedData,
        });

        // --- WHEN
        const setProtectedDataForSaleResult =
          await dataProtectorCreator.sharing.setProtectedDataForSale({
            protectedData,
            price: 1,
          });

        // --- THEN
        expect(setProtectedDataForSaleResult).toEqual({
          txHash: expect.any(String),
        });
      },
      timeouts.protectData +
        timeouts.addToCollection +
        timeouts.setProtectedDataForSale +
        timeouts.getProtectedDataById
    );
  });
});
