import { beforeAll, describe, expect, it } from '@jest/globals';
import { Wallet } from 'ethers';
import { ValidationError } from 'yup';
import { getWeb3Provider, IExecDataProtector } from '../../../src/index.js';
import { timeouts } from '../../test-utils.js';

describe('dataProtector.setProtectedDataForSale()', () => {
  let dataProtectorCreator: IExecDataProtector;
  let dataProtectorEndUser: IExecDataProtector;
  let collectionTokenId: number;
  let protectedDataAddress: string;

  beforeAll(async () => {
    const walletCreator = Wallet.createRandom();
    const walletEndUser = Wallet.createRandom();
    dataProtectorCreator = new IExecDataProtector(
      getWeb3Provider(walletCreator.privateKey)
    );
    dataProtectorEndUser = new IExecDataProtector(
      getWeb3Provider(walletEndUser.privateKey)
    );

    const createCollectionResult =
      await dataProtectorCreator.dataProtectorSharing.createCollection();
    collectionTokenId = createCollectionResult.collectionTokenId;

    const { address } = await dataProtectorCreator.dataProtector.protectData({
      data: { doNotUse: 'test' },
      name: 'test setProtectedDataForSale()',
    });
    protectedDataAddress = address;

    await dataProtectorCreator.dataProtectorSharing.addToCollection({
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
        dataProtectorCreator.dataProtectorSharing.setProtectedDataForSale({
          protectedDataAddress: invalidProtectedDataAddress,
          priceInNRLC: 1,
        })
      ).rejects.toThrow(
        new ValidationError(
          'protectedDataAddress should be an ethereum address, a ENS name, or "any"'
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
        dataProtectorCreator.dataProtectorSharing.setProtectedDataForSale({
          protectedDataAddress: '0xbb673ac41acfbee381fe2e784d14c53b1cdc5946',
          priceInNRLC: invalidPriceInNRLC,
        })
      ).rejects.toThrow(
        new ValidationError('priceInNRLC must be greater than or equal to 0')
      );
    });
  });

  describe('should fail if the collection does not seem to exist or it has been burned', () => {
    it('should throw an error', async () => {
      // --- GIVEN
      const protectedDataAddressThatDoesNotExist =
        '0xbb673ac41acfbee381fe2e784d14c53b1cdc5946';

      // --- WHEN / THEN
      await expect(
        dataProtectorCreator.dataProtectorSharing.setProtectedDataForSale({
          protectedDataAddress: protectedDataAddressThatDoesNotExist,
          priceInNRLC: 1,
        })
      ).rejects.toThrow(
        new Error(
          'This collection does not seem to exist or it has been burned.'
        )
      );
    });
  });

  describe('When the given protected data still has active rentals', () => {
    it(
      'should throw an error',
      async () => {
        // --- GIVEN
        await dataProtectorCreator.dataProtectorSharing.setProtectedDataToRenting(
          {
            protectedDataAddress,
            priceInNRLC: 0,
            durationInSeconds: 30 * 24 * 60 * 60,
          }
        );

        await dataProtectorEndUser.dataProtectorSharing.rentProtectedData({
          protectedDataAddress,
        });

        // --- WHEN / THEN
        await expect(
          dataProtectorCreator.dataProtectorSharing.setProtectedDataForSale({
            protectedDataAddress,
            priceInNRLC: 1,
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
        const { address } =
          await dataProtectorCreator.dataProtector.protectData({
            data: { doNotUse: 'test' },
            name: 'test setProtectedDataForSale()',
          });
        protectedDataAddress = address;

        await dataProtectorCreator.dataProtectorSharing.addToCollection({
          collectionTokenId,
          protectedDataAddress,
        });

        // --- WHEN
        const setProtectedDataForSaleResult =
          await dataProtectorCreator.dataProtectorSharing.setProtectedDataForSale(
            {
              protectedDataAddress,
              priceInNRLC: 1,
            }
          );

        // --- THEN
        expect(setProtectedDataForSaleResult).toEqual({
          success: true,
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
