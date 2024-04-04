import { beforeAll, describe, expect, it } from '@jest/globals';
import { Wallet, type HDNodeWallet } from 'ethers';
import { ValidationError } from 'yup';
import { IExecDataProtector } from '../../../src/index.js';
import { getTestConfig, timeouts } from '../../test-utils.js';

describe('dataProtector.buyProtectedData()', () => {
  let seller: HDNodeWallet;
  let buyer: HDNodeWallet;
  let dataProtectorForSeller: IExecDataProtector;
  let dataProtectorForBuyer: IExecDataProtector;
  let sellerCollectionTokenId: number;
  let buyerCollectionTokenId: number;

  beforeAll(async () => {
    seller = Wallet.createRandom();
    dataProtectorForSeller = new IExecDataProtector(
      ...getTestConfig(seller.privateKey)
    );

    buyer = Wallet.createRandom();
    dataProtectorForBuyer = new IExecDataProtector(
      ...getTestConfig(buyer.privateKey)
    );

    const createCollectionResult1 =
      await dataProtectorForSeller.sharing.createCollection();
    sellerCollectionTokenId = createCollectionResult1.collectionTokenId;

    const createCollectionResult2 =
      await dataProtectorForBuyer.sharing.createCollection();
    buyerCollectionTokenId = createCollectionResult2.collectionTokenId;
  }, 2 * timeouts.createCollection);

  describe('When calling buyProtectedData() WITHOUT a collectionTokenIdTo', () => {
    it(
      'should answer with success true and transfer ownership',
      async () => {
        const result = await dataProtectorForSeller.core.protectData({
          name: 'test',
          data: { doNotUse: 'test buyProtectedData' },
        });
        await dataProtectorForSeller.sharing.addToCollection({
          protectedDataAddress: result.address,
          collectionTokenId: sellerCollectionTokenId,
        });

        const price = 0;
        await dataProtectorForSeller.sharing.setProtectedDataForSale({
          protectedDataAddress: result.address,
          priceInNRLC: price,
        });

        // --- WHEN
        const buyProtectedDataResult =
          await dataProtectorForBuyer.sharing.buyProtectedData({
            protectedDataAddress: result.address,
          });

        // --- THEN
        expect(buyProtectedDataResult).toEqual({
          txHash: expect.any(String),
        });
      },
      timeouts.protectData +
        timeouts.addToCollection +
        timeouts.setProtectedDataForSale +
        timeouts.buyProtectedData
    );
  });

  describe('When calling buyProtectedData() WITH a collectionTokenIdTo', () => {
    it(
      "should answer with success true and add it to new owner's collection",
      async () => {
        const result = await dataProtectorForSeller.core.protectData({
          name: 'test',
          data: { doNotUse: 'test buyProtectedData' },
        });

        await dataProtectorForSeller.sharing.addToCollection({
          protectedDataAddress: result.address,
          collectionTokenId: sellerCollectionTokenId,
        });

        const price = 0;
        await dataProtectorForSeller.sharing.setProtectedDataForSale({
          protectedDataAddress: result.address,
          priceInNRLC: price,
        });

        // --- WHEN
        const buyProtectedDataResult =
          await dataProtectorForBuyer.sharing.buyProtectedData({
            protectedDataAddress: result.address,
            collectionTokenIdTo: buyerCollectionTokenId,
          });

        // --- THEN
        expect(buyProtectedDataResult).toEqual({
          txHash: expect.any(String),
        });
      },
      timeouts.protectData +
        timeouts.addToCollection +
        timeouts.setProtectedDataForSale +
        timeouts.buyProtectedData
    );
  });

  describe('When the given protected data address is not a valid address', () => {
    it(
      'should throw with the corresponding error',
      async () => {
        // --- GIVEN
        const invalidProtectedDataAddress = '0x123...';
        // --- WHEN / THEN
        await expect(
          dataProtectorForBuyer.sharing.buyProtectedData({
            protectedDataAddress: invalidProtectedDataAddress,
          })
        ).rejects.toThrow(
          new ValidationError(
            'protectedDataAddress should be an ethereum address or a ENS name'
          )
        );
      },
      timeouts.buyProtectedData
    );
  });

  describe('When the given protected data does NOT exist', () => {
    it('should fail if the protected data is not a part of a collection', async () => {
      // --- GIVEN
      const protectedDataAddressThatDoesNotExist =
        '0xbb673ac41acfbee381fe2e784d14c53b1cdc5946';

      // --- WHEN / THEN
      await expect(
        dataProtectorForBuyer.sharing.buyProtectedData({
          protectedDataAddress: protectedDataAddressThatDoesNotExist,
        })
      ).rejects.toThrow(
        `The protected data is not a part of a collection: ${protectedDataAddressThatDoesNotExist}`
      );
    });
  });

  describe('When the given protected data is not currently for sale', () => {
    it(
      'should throw an error',
      async () => {
        // --- GIVEN
        const { address } = await dataProtectorForBuyer.core.protectData({
          data: { doNotUse: 'test' },
          name: 'test buyProtectedData()',
        });

        const { collectionTokenId } =
          await dataProtectorForBuyer.sharing.createCollection();

        await dataProtectorForBuyer.sharing.addToCollection({
          collectionTokenId,
          protectedDataAddress: address,
        });

        // --- WHEN / THEN
        await expect(
          dataProtectorForBuyer.sharing.buyProtectedData({
            protectedDataAddress: address,
          })
        ).rejects.toThrow(
          new Error('This protected data is currently not for sale.')
        );
      },
      timeouts.protectData +
        timeouts.addToCollection +
        timeouts.buyProtectedData
    );
  });
});
