import { beforeAll, describe, expect, it } from '@jest/globals';
import { HDNodeWallet, Wallet } from 'ethers';
import { DEFAULT_SHARING_CONTRACT_ADDRESS } from '../../../src/config/config.js';
import { IExecDataProtector } from '../../../src/index.js';
import {
  approveAccount,
  depositNRlcForAccount,
  getTestConfig,
  setNRlcBalance,
  timeouts,
} from '../../test-utils.js';

describe('dataProtector.subscribeToCollection()', () => {
  let walletEndUser: HDNodeWallet;
  let dataProtectorCreator: IExecDataProtector;
  let dataProtectorEndUser: IExecDataProtector;

  beforeAll(async () => {
    const walletCreator = Wallet.createRandom();
    dataProtectorCreator = new IExecDataProtector(
      ...getTestConfig(walletCreator.privateKey)
    );
  });

  beforeEach(() => {
    // use a brand new wallet for the renter
    walletEndUser = Wallet.createRandom();
    dataProtectorEndUser = new IExecDataProtector(
      ...getTestConfig(walletEndUser.privateKey)
    );
  });

  describe('When calling subscribe()', () => {
    describe('when subscription is free', () => {
      it(
        'should work',
        async () => {
          const { collectionId } =
            await dataProtectorCreator.sharing.createCollection();

          const subscriptionParams = { price: 0, duration: 2000 };
          await dataProtectorCreator.sharing.setSubscriptionParams({
            collectionId,
            ...subscriptionParams,
          });

          const subscribeResult =
            await dataProtectorEndUser.sharing.subscribeToCollection({
              collectionId,
              ...subscriptionParams,
            });
          expect(subscribeResult).toEqual({
            txHash: expect.any(String),
          });
        },
        timeouts.createCollection +
          timeouts.setSubscriptionParams +
          timeouts.subscribe
      );
    });
    describe('when subscription is not free', () => {
      describe('when the subscriber has NOT enough stack nRlc on her/his account', () => {
        it(
          'should throw the corresponding error',
          async () => {
            const { collectionId } =
              await dataProtectorCreator.sharing.createCollection();

            const subscriptionParams = { price: 100, duration: 2000 };
            await dataProtectorCreator.sharing.setSubscriptionParams({
              collectionId,
              ...subscriptionParams,
            });

            await expect(
              dataProtectorEndUser.sharing.subscribeToCollection({
                collectionId,
                ...subscriptionParams,
              })
            ).rejects.toThrow(new Error('Account balance is insufficient.'));
          },
          timeouts.createCollection +
            timeouts.setSubscriptionParams +
            timeouts.subscribe
        );
        describe('when the subscriber has NOT enough stack nRlc on her/his account but her/his has xRLC on bellecour', () => {
          it(
            'should throw the corresponding error',
            async () => {
              const { collectionId } =
                await dataProtectorCreator.sharing.createCollection();

              const subscriptionParams = { price: 100, duration: 2000 };
              await dataProtectorCreator.sharing.setSubscriptionParams({
                collectionId,
                ...subscriptionParams,
              });
              await setNRlcBalance(walletEndUser.address, 2);
              await expect(
                dataProtectorEndUser.sharing.subscribeToCollection({
                  collectionId,
                  ...subscriptionParams,
                })
              ).rejects.toThrow(
                new Error(
                  'No xRLC stacked. To interact with the iExec protocol, you need to stake some xRLC. Visit https://explorer.iex.ec/bellecour, log in with your Wallet that your are using in this dev tool, and stake xRLC in the iExec protocol.'
                )
              );
            },
            timeouts.createCollection +
              timeouts.setSubscriptionParams +
              timeouts.subscribe
          );
        });
      });
      describe('when the subscriber has enough stacked nRlc on her/his account', () => {
        describe('when the subscriber has approved the contract to debit the account', () => {
          it(
            'should work',
            async () => {
              const { collectionId } =
                await dataProtectorCreator.sharing.createCollection();

              const subscriptionParams = { price: 100, duration: 2000 };
              await dataProtectorCreator.sharing.setSubscriptionParams({
                collectionId,
                ...subscriptionParams,
              });

              await depositNRlcForAccount(
                walletEndUser.address,
                subscriptionParams.price
              );
              await approveAccount(
                walletEndUser.privateKey,
                DEFAULT_SHARING_CONTRACT_ADDRESS,
                subscriptionParams.price
              );

              const subscribeResult =
                await dataProtectorEndUser.sharing.subscribeToCollection({
                  collectionId,
                  ...subscriptionParams,
                });
              expect(subscribeResult).toEqual({
                txHash: expect.any(String),
              });
            },
            timeouts.createCollection +
              timeouts.setSubscriptionParams +
              timeouts.subscribe
          );
        });
        describe('when the subscriber has NOT approved the contract to debit the account', () => {
          it(
            'should approveAndCall and work',
            async () => {
              const { collectionId } =
                await dataProtectorCreator.sharing.createCollection();

              const subscriptionParams = { price: 100, duration: 2000 };
              await dataProtectorCreator.sharing.setSubscriptionParams({
                collectionId,
                ...subscriptionParams,
              });

              await depositNRlcForAccount(
                walletEndUser.address,
                subscriptionParams.price
              );

              const subscribeResult =
                await dataProtectorEndUser.sharing.subscribeToCollection({
                  collectionId,
                  ...subscriptionParams,
                });
              expect(subscribeResult).toEqual({
                txHash: expect.any(String),
              });
            },
            timeouts.createCollection +
              timeouts.setSubscriptionParams +
              timeouts.subscribe
          );
        });
      });
    });
  });

  describe('When calling subscribe() with invalid collection ID', () => {
    it(
      'should throw the corresponding error',
      async () => {
        const collectionId = -1;
        const subscriptionParams = { price: 0, duration: 2000 };
        // --- WHEN / THEN
        await expect(
          dataProtectorEndUser.sharing.subscribeToCollection({
            collectionId,
            ...subscriptionParams,
          })
        ).rejects.toThrow(
          new Error('collectionId must be greater than or equal to 0')
        );
      },
      timeouts.subscribe
    );
  });

  describe('When calling subscribe() with collection ID that does not exist', () => {
    it(
      'should throw the corresponding error',
      async () => {
        // Increment this value as needed
        const collectionIdThatDoesNotExist = 9999999;
        const subscriptionParams = { price: 0, duration: 2000 };
        // --- WHEN / THEN
        await expect(
          dataProtectorEndUser.sharing.subscribeToCollection({
            collectionId: collectionIdThatDoesNotExist,
            ...subscriptionParams,
          })
        ).rejects.toThrow(
          new Error(
            `collectionId does not exist in the protectedDataSharing contract: ${collectionIdThatDoesNotExist}`
          )
        );
      },
      timeouts.subscribe
    );
  });
});
