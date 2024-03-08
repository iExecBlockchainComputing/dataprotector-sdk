import { beforeAll, describe, expect, it } from '@jest/globals';
import { type HDNodeWallet, Wallet } from 'ethers';
import { ValidationError } from 'yup';
import { getWeb3Provider, IExecDataProtector } from '../../../src/index.js';
import { timeouts } from '../../test-utils.js';

describe('dataProtector.removeProtectedDataForSale()', () => {
  let dataProtector: IExecDataProtector;
  let wallet: HDNodeWallet;
  let collectionTokenId: number;
  let protectedDataAddress: string;

  beforeAll(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtector(getWeb3Provider(wallet.privateKey));

    const createCollectionResult =
      await dataProtector.sharing.createCollection();
    collectionTokenId = createCollectionResult.collectionTokenId;

    const { address } = await dataProtector.core.protectData({
      data: { doNotUse: 'test' },
      name: 'test removeProtectedDataForSale()',
    });
    protectedDataAddress = address;

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
        dataProtector.sharing.removeProtectedDataForSale({
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
        dataProtector.sharing.removeProtectedDataForSale({
          protectedDataAddress: protectedDataAddressThatDoesNotExist,
        })
      ).rejects.toThrow(
        new Error(
          `The protected data is not a part of a collection: ${protectedDataAddressThatDoesNotExist}`
        )
      );
    });
  });

  describe('When the given protected data is not currently for sale', () => {
    it('should throw an error', async () => {
      await expect(
        dataProtector.sharing.removeProtectedDataForSale({
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
        await dataProtector.sharing.setProtectedDataForSale({
          protectedDataAddress,
          priceInNRLC: 1,
        });

        // --- WHEN
        const removeProtectedDataForSaleResult =
          await dataProtector.sharing.removeProtectedDataForSale({
            protectedDataAddress,
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
