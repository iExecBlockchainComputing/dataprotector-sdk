import { beforeAll, describe, expect, it } from '@jest/globals';
import { Wallet, type HDNodeWallet } from 'ethers';
import { ValidationError } from 'yup';
import { DEFAULT_SHARING_CONTRACT_ADDRESS } from '../../../src/config/config.js';
import { IExecDataProtector } from '../../../src/index.js';
import {
  approveAccount,
  depositNRlcForAccount,
  getTestConfig,
  timeouts,
} from '../../test-utils.js';

describe('dataProtector.buyProtectedData()', () => {
  let seller: HDNodeWallet;
  let buyer: HDNodeWallet;
  let dataProtectorForSeller: IExecDataProtector;
  let dataProtectorForBuyer: IExecDataProtector;
  let sellerCollectionId: number;
  let buyerCollectionId: number;
  let addOnlyAppWhitelist: string;

  beforeAll(async () => {
    seller = Wallet.createRandom();
    dataProtectorForSeller = new IExecDataProtector(
      ...getTestConfig(seller.privateKey)
    );

    const createSellerCollectionResult =
      await dataProtectorForSeller.sharing.createCollection();
    sellerCollectionId = createSellerCollectionResult.collectionId;

    const addOnlyAppWhitelistResponse =
      await dataProtectorForSeller.sharing.createAddOnlyAppWhitelist();
    addOnlyAppWhitelist = addOnlyAppWhitelistResponse.addOnlyAppWhitelist;
  }, 2 * timeouts.createCollection);

  beforeEach(async () => {
    // use a brand new wallet for the buyer
    buyer = Wallet.createRandom();
    dataProtectorForBuyer = new IExecDataProtector(
      ...getTestConfig(buyer.privateKey)
    );
  });

  describe('When calling buyProtectedData() WITHOUT a collectionIdTo', () => {
    describe('when the buyer has NOT enough nRlc on her/his account', () => {
      it(
        'should throw with the corresponding error',
        async () => {
          const result = await dataProtectorForSeller.core.protectData({
            name: 'test',
            data: { doNotUse: 'test buyProtectedData' },
          });
          await dataProtectorForSeller.sharing.addToCollection({
            protectedData: result.address,
            addOnlyAppWhitelist,
            collectionId: sellerCollectionId,
          });

          const price = 1;
          await dataProtectorForSeller.sharing.setProtectedDataForSale({
            protectedData: result.address,
            price,
          });
          // --- WHEN / THEN
          await expect(
            dataProtectorForBuyer.sharing.buyProtectedData({
              protectedData: result.address,
              price,
            })
          ).rejects.toThrow(new Error('Account balance is insufficient.'));
        },
        timeouts.protectData +
          timeouts.addToCollection +
          timeouts.setProtectedDataForSale +
          timeouts.buyProtectedData
      );
    });
    describe('when the buyer has enough nRlc on her/his account', () => {
      describe('when the buyer has approved the contract to debit the account', () => {
        it(
          'should answer with success true and transfer ownership',
          async () => {
            const result = await dataProtectorForSeller.core.protectData({
              name: 'test',
              data: { doNotUse: 'test buyProtectedData' },
            });
            await dataProtectorForSeller.sharing.addToCollection({
              protectedData: result.address,
              addOnlyAppWhitelist,
              collectionId: sellerCollectionId,
            });

            const price = 100;
            await dataProtectorForSeller.sharing.setProtectedDataForSale({
              protectedData: result.address,
              price,
            });

            await depositNRlcForAccount(buyer.address, price);
            await approveAccount(
              buyer.privateKey,
              DEFAULT_SHARING_CONTRACT_ADDRESS,
              price
            );

            // --- WHEN
            const buyProtectedDataResult =
              await dataProtectorForBuyer.sharing.buyProtectedData({
                protectedData: result.address,
                price,
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
      describe('when the buyer has NOT approved the contract to debit the account', () => {
        it(
          'should approveAndCall and answer with success true and transfer ownership',
          async () => {
            const result = await dataProtectorForSeller.core.protectData({
              name: 'test',
              data: { doNotUse: 'test buyProtectedData' },
            });
            await dataProtectorForSeller.sharing.addToCollection({
              protectedData: result.address,
              addOnlyAppWhitelist,
              collectionId: sellerCollectionId,
            });

            const price = 100;
            await dataProtectorForSeller.sharing.setProtectedDataForSale({
              protectedData: result.address,
              price,
            });

            await depositNRlcForAccount(buyer.address, price);

            // --- WHEN
            const buyProtectedDataResult =
              await dataProtectorForBuyer.sharing.buyProtectedData({
                protectedData: result.address,
                price,
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
    });
  });

  describe('When calling buyProtectedData() WITH a collectionIdTo', () => {
    beforeEach(async () => {
      const createBuyerCollectionResult =
        await dataProtectorForBuyer.sharing.createCollection();
      buyerCollectionId = createBuyerCollectionResult.collectionId;
    }, timeouts.createCollection);

    it(
      "should answer with success true and add it to new owner's collection",
      async () => {
        const result = await dataProtectorForSeller.core.protectData({
          name: 'test',
          data: { doNotUse: 'test buyProtectedData' },
        });

        await dataProtectorForSeller.sharing.addToCollection({
          protectedData: result.address,
          addOnlyAppWhitelist,
          collectionId: sellerCollectionId,
        });

        const price = 0;
        await dataProtectorForSeller.sharing.setProtectedDataForSale({
          protectedData: result.address,
          price,
        });

        // --- WHEN
        const buyProtectedDataResult =
          await dataProtectorForBuyer.sharing.buyProtectedData({
            protectedData: result.address,
            addOnlyAppWhitelist,
            addToCollectionId: buyerCollectionId,
            price,
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
        const invalidProtectedData = '0x123...';
        // --- WHEN / THEN
        await expect(
          dataProtectorForBuyer.sharing.buyProtectedData({
            protectedData: invalidProtectedData,
            price: 0,
          })
        ).rejects.toThrow(
          new ValidationError(
            'protectedData should be an ethereum address or a ENS name'
          )
        );
      },
      timeouts.buyProtectedData
    );
  });

  describe('When the given protected data does NOT exist', () => {
    it('should fail if the protected data is not a part of a collection', async () => {
      // --- GIVEN
      const protectedDataThatDoesNotExist =
        '0xbb673ac41acfbee381fe2e784d14c53b1cdc5946';

      // --- WHEN / THEN
      await expect(
        dataProtectorForBuyer.sharing.buyProtectedData({
          protectedData: protectedDataThatDoesNotExist,
          price: 0,
        })
      ).rejects.toThrow(
        `The protected data is not a part of a collection: ${protectedDataThatDoesNotExist}`
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

        const { collectionId } =
          await dataProtectorForBuyer.sharing.createCollection();

        await dataProtectorForBuyer.sharing.addToCollection({
          collectionId,
          addOnlyAppWhitelist,
          protectedData: address,
        });

        // --- WHEN / THEN
        await expect(
          dataProtectorForBuyer.sharing.buyProtectedData({
            protectedData: address,
            price: 0,
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
