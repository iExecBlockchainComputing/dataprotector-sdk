import { beforeAll, describe, expect, it } from '@jest/globals';
import { HDNodeWallet, Wallet } from 'ethers';
import { getChainConfig } from '../../../src/config/config.js';
import { IExecDataProtector } from '../../../src/index.js';
import {
  approveAccount,
  depositNRlcForAccount,
  getTestConfig,
  timeouts,
} from '../../test-utils.js';

describe('dataProtector.rentProtectedData()', () => {
  let walletEndUser: HDNodeWallet;
  let dataProtectorCreator: IExecDataProtector;
  let dataProtectorEndUser: IExecDataProtector;
  let addOnlyAppWhitelist: string;

  beforeAll(async () => {
    const walletCreator = Wallet.createRandom();

    dataProtectorCreator = new IExecDataProtector(
      ...getTestConfig(walletCreator.privateKey)
    );

    const addOnlyAppWhitelistResponse =
      await dataProtectorCreator.sharing.createAddOnlyAppWhitelist();
    addOnlyAppWhitelist = addOnlyAppWhitelistResponse.addOnlyAppWhitelist;
  });

  beforeEach(() => {
    // use a brand new wallet for the renter
    walletEndUser = Wallet.createRandom();
    dataProtectorEndUser = new IExecDataProtector(
      ...getTestConfig(walletEndUser.privateKey)
    );
  });

  describe('When calling rentProtectedData()', () => {
    describe('when renting is free', () => {
      it(
        'should answer with success true',
        async () => {
          // --- GIVEN
          const result = await dataProtectorCreator.core.protectData({
            name: 'test',
            data: { doNotUse: 'test' },
          });

          const { collectionId } =
            await dataProtectorCreator.sharing.createCollection();

          await dataProtectorCreator.sharing.addToCollection({
            protectedData: result.address,
            addOnlyAppWhitelist,
            collectionId,
          });
          const rentingParams = { price: 0, duration: 30 * 24 * 60 * 60 };
          await dataProtectorCreator.sharing.setProtectedDataToRenting({
            protectedData: result.address,
            ...rentingParams,
          });

          // --- WHEN
          const rentProtectedDataResult =
            await dataProtectorEndUser.sharing.rentProtectedData({
              protectedData: result.address,
              ...rentingParams,
            });

          // --- THEN
          expect(rentProtectedDataResult).toEqual({
            txHash: expect.any(String),
          });
        },
        timeouts.protectData +
          timeouts.createCollection +
          timeouts.addToCollection +
          timeouts.setProtectedDataToRenting +
          timeouts.rentProtectedData
      );
    });
    describe('when renting is not free', () => {
      describe('when the renter has NOT enough nRlc on her/his account', () => {
        it(
          'should throw the corresponding error',
          async () => {
            // --- GIVEN
            const result = await dataProtectorCreator.core.protectData({
              name: 'test',
              data: { doNotUse: 'test' },
            });

            const { collectionId } =
              await dataProtectorCreator.sharing.createCollection();

            await dataProtectorCreator.sharing.addToCollection({
              protectedData: result.address,
              addOnlyAppWhitelist,
              collectionId,
            });
            const rentingParams = { price: 1, duration: 30 * 24 * 60 * 60 };
            await dataProtectorCreator.sharing.setProtectedDataToRenting({
              protectedData: result.address,
              ...rentingParams,
            });

            // --- WHEN / THEN
            await expect(
              dataProtectorEndUser.sharing.rentProtectedData({
                protectedData: result.address,
                ...rentingParams,
              })
            ).rejects.toThrow(
              new Error(
                'Not enough xRLC in your iExec account. You may have xRLC in your wallet but to interact with the iExec protocol, you need to deposit some xRLC into your iExec account.'
              )
            );
          },
          timeouts.protectData +
            timeouts.createCollection +
            timeouts.addToCollection +
            timeouts.setProtectedDataToRenting +
            timeouts.rentProtectedData
        );
      });
      describe('when the renter has enough nRlc on her/his account', () => {
        describe('when the buyer has approved the contract to debit the account', () => {
          it(
            'should answer with success true',
            async () => {
              // --- GIVEN
              const result = await dataProtectorCreator.core.protectData({
                name: 'test',
                data: { doNotUse: 'test' },
              });

              const { collectionId } =
                await dataProtectorCreator.sharing.createCollection();

              await dataProtectorCreator.sharing.addToCollection({
                protectedData: result.address,
                addOnlyAppWhitelist,
                collectionId,
              });
              const rentingParams = { price: 10, duration: 30 * 24 * 60 * 60 };
              await dataProtectorCreator.sharing.setProtectedDataToRenting({
                protectedData: result.address,
                ...rentingParams,
              });

              await depositNRlcForAccount(
                walletEndUser.address,
                rentingParams.price
              );
              await approveAccount(
                walletEndUser.privateKey,
                getChainConfig(134).sharingContractAddress,
                rentingParams.price
              );

              // --- WHEN
              const rentProtectedDataResult =
                await dataProtectorEndUser.sharing.rentProtectedData({
                  protectedData: result.address,
                  ...rentingParams,
                });

              // --- THEN
              expect(rentProtectedDataResult).toEqual({
                txHash: expect.any(String),
              });
            },
            timeouts.protectData +
              timeouts.createCollection +
              timeouts.addToCollection +
              timeouts.setProtectedDataToRenting +
              timeouts.rentProtectedData
          );
        });
        describe('when the buyer has NOT approved the contract to debit the account', () => {
          it(
            'should approveAndCall and answer with success true',
            async () => {
              // --- GIVEN
              const result = await dataProtectorCreator.core.protectData({
                name: 'test',
                data: { doNotUse: 'test' },
              });

              const { collectionId } =
                await dataProtectorCreator.sharing.createCollection();

              await dataProtectorCreator.sharing.addToCollection({
                protectedData: result.address,
                addOnlyAppWhitelist,
                collectionId,
              });
              const rentingParams = { price: 10, duration: 30 * 24 * 60 * 60 };
              await dataProtectorCreator.sharing.setProtectedDataToRenting({
                protectedData: result.address,
                ...rentingParams,
              });

              await depositNRlcForAccount(
                walletEndUser.address,
                rentingParams.price
              );

              // --- WHEN
              const rentProtectedDataResult =
                await dataProtectorEndUser.sharing.rentProtectedData({
                  protectedData: result.address,
                  ...rentingParams,
                });

              // --- THEN
              expect(rentProtectedDataResult).toEqual({
                txHash: expect.any(String),
              });
            },
            timeouts.protectData +
              timeouts.createCollection +
              timeouts.addToCollection +
              timeouts.setProtectedDataToRenting +
              timeouts.rentProtectedData
          );
        });
      });
    });
  });

  describe('When calling rentProtectedData() when Protected Data is not set to renting', () => {
    it(
      'should throw the corresponding error',
      async () => {
        // --- GIVEN
        const result = await dataProtectorCreator.core.protectData({
          name: 'test',
          data: { doNotUse: 'test' },
        });
        const rentingParams = { price: 0, duration: 30 * 24 * 60 * 60 };

        const { collectionId } =
          await dataProtectorCreator.sharing.createCollection();

        await dataProtectorCreator.sharing.addToCollection({
          protectedData: result.address,
          addOnlyAppWhitelist,
          collectionId,
        });
        // --- WHEN / THEN
        await expect(
          dataProtectorEndUser.sharing.rentProtectedData({
            protectedData: result.address,
            ...rentingParams,
          })
        ).rejects.toThrow(
          new Error('This protected data is not available for renting.')
        );
      },
      timeouts.protectData +
        timeouts.createCollection +
        timeouts.addToCollection +
        timeouts.rentProtectedData
    );
  });

  describe('When the given protected data address is not a valid address', () => {
    it(
      'should throw with the corresponding error',
      async () => {
        // --- GIVEN
        const invalidProtectedData = '0x123...';
        const rentingParams = { price: 0, duration: 30 * 24 * 60 * 60 };

        // --- WHEN / THEN
        await expect(
          dataProtectorEndUser.sharing.rentProtectedData({
            protectedData: invalidProtectedData,
            ...rentingParams,
          })
        ).rejects.toThrow(
          new Error('protectedData should be an ethereum address or a ENS name')
        );
      },
      timeouts.rentProtectedData
    );
  });
});
