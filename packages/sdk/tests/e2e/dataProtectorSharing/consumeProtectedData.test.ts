import { beforeAll, describe, expect, it } from '@jest/globals';
import { Wallet } from 'ethers';
import { Address, IExec, utils } from 'iexec';
import { DEFAULT_SHARING_CONTRACT_ADDRESS } from '../../../src/config/config.js';
import { IExecDataProtector } from '../../../src/index.js';
import {
  DEFAULT_PROTECTED_DATA_DELIVERY_APP,
  TEST_CHAIN,
  addVoucherEligibleAsset,
  approveAccount,
  createAndPublishWorkerpoolOrder,
  createVoucher,
  createVoucherType,
  depositNRlcForAccount,
  getTestConfig,
  getTestIExecOption,
  setNRlcBalance,
  timeouts,
} from '../../test-utils.js';

import 'dotenv/config';
const { ENV = 'bellecour-fork' } = process.env;

describe('dataProtector.consumeProtectedData()', () => {
  let dataProtectorCreator: IExecDataProtector;
  let dataProtectorConsumer: IExecDataProtector;
  let addOnlyAppWhitelist: string;
  let protectedData: Address;
  let collectionId;
  const subscriptionParams = { price: 0, duration: 2_592_000 };
  const walletCreator = Wallet.createRandom();
  const walletConsumer = Wallet.createRandom();
  const workerpoolPrice = 1000;
  beforeAll(async () => {
    dataProtectorCreator = new IExecDataProtector(
      ...getTestConfig(walletCreator.privateKey)
    );
    dataProtectorConsumer = new IExecDataProtector(
      ...getTestConfig(walletConsumer.privateKey)
    );
    const addOnlyAppWhitelistResponse =
      await dataProtectorCreator.sharing.createAddOnlyAppWhitelist();
    addOnlyAppWhitelist = addOnlyAppWhitelistResponse.addOnlyAppWhitelist;

    if (ENV === 'bellecour-fork') {
      await createAndPublishWorkerpoolOrder(
        TEST_CHAIN.debugWorkerpool,
        TEST_CHAIN.debugWorkerpoolOwnerWallet,
        workerpoolPrice
      );
    }
    const result = await dataProtectorCreator.core.protectData({
      data: { file: 'test' },
      name: 'consumeProtectedDataTest',
    });
    protectedData = result.address;
    const collection = await dataProtectorCreator.sharing.createCollection();
    collectionId = collection.collectionId;
    await dataProtectorCreator.sharing.addToCollection({
      collectionId,
      addOnlyAppWhitelist,
      protectedData,
    });
    await dataProtectorCreator.sharing.setSubscriptionParams({
      collectionId,
      ...subscriptionParams,
    });
    await dataProtectorCreator.sharing.setProtectedDataToSubscription({
      protectedData,
    });
    const rentingParams = {
      price: 0,
      duration: 30 * 24 * 60 * 60,
    };
    await dataProtectorCreator.sharing.setProtectedDataToRenting({
      protectedData,
      ...rentingParams,
    });

    await dataProtectorConsumer.sharing.subscribeToCollection({
      collectionId,
      ...subscriptionParams,
    });
  }, timeouts.createAddOnlyAppWhitelist + timeouts.createAndPublishWorkerpoolOrder + timeouts.protectData + timeouts.createCollection + timeouts.addToCollection + timeouts.setSubscriptionParams + timeouts.setProtectedDataToSubscription + timeouts.setProtectedDataToRenting + timeouts.subscribe);

  describe('When whitelist contract does not have registered delivery app', () => {
    it(
      'should throw error',
      async () => {
        await expect(
          dataProtectorConsumer.sharing.consumeProtectedData({
            app: DEFAULT_PROTECTED_DATA_DELIVERY_APP,
            protectedData,
            workerpool: TEST_CHAIN.debugWorkerpool,
            maxPrice: 1000,
          })
        ).rejects.toThrow(
          `This whitelist contract does not have registered this app: ${DEFAULT_PROTECTED_DATA_DELIVERY_APP.toLocaleLowerCase()}.`
        );
      },
      timeouts.consumeProtectedData
    );
  });

  describe('When whitelist contract registered delivery app', () => {
    beforeAll(async () => {
      // add app 'protected-data-delivery-dapp.apps.iexec.eth' to AppWhitelist SC
      await dataProtectorCreator.sharing.addAppToAddOnlyAppWhitelist({
        addOnlyAppWhitelist,
        app: DEFAULT_PROTECTED_DATA_DELIVERY_APP,
      });
    }, timeouts.addAppToAddOnlyAppWhitelist);

    it(
      'should create a deal with valid inputs',
      async () => {
        if (ENV === 'bellecour-fork') {
          await depositNRlcForAccount(walletConsumer.address, 1000_000);
          await approveAccount(
            walletConsumer.privateKey,
            DEFAULT_SHARING_CONTRACT_ADDRESS,
            1000_000
          );
        }

        let testResolve;
        const testPromise = new Promise((resolve) => {
          testResolve = resolve;
        });

        const status = [];
        const onStatusUpdate = ({ title, isDone, payload }) => {
          status.push({ title, isDone, payload });
          if (title === 'CONSUME_TASK') {
            testResolve();
          }
        };
        dataProtectorConsumer.sharing.consumeProtectedData({
          app: DEFAULT_PROTECTED_DATA_DELIVERY_APP,
          protectedData,
          workerpool: TEST_CHAIN.debugWorkerpool,
          maxPrice: 1000,
          onStatusUpdate,
        });

        await testPromise; // wait for the manual resolution

        expect(status[5].title).toBe('CONSUME_ORDER_REQUESTED');
        expect(status[5].isDone).toBe(true);
        expect(status[5].payload.txHash).toBeDefined();
        expect(status[6].title).toBe('CONSUME_TASK');
        expect(status[6].payload.dealId).toBeDefined();
        expect(status[6].payload.taskId).toBeDefined();
      },
      6 * timeouts.tx + // depositNRlcForAccount + approveAccount
        timeouts.consumeProtectedData
    );

    it(
      'should throw error with invalid rentals or subscriptions',
      async () => {
        const { address: protectedDataUnauthorizedToConsume } =
          await dataProtectorCreator.core.protectData({
            data: { doNotUse: 'test' },
            name: 'test addToCollection',
          });
        await dataProtectorCreator.sharing.addToCollection({
          collectionId,
          protectedData: protectedDataUnauthorizedToConsume,
          addOnlyAppWhitelist,
        });
        await expect(
          dataProtectorConsumer.sharing.consumeProtectedData({
            app: DEFAULT_PROTECTED_DATA_DELIVERY_APP,
            protectedData: protectedDataUnauthorizedToConsume,
            workerpool: TEST_CHAIN.debugWorkerpool,
            maxPrice: 1000,
          })
        ).rejects.toThrow(
          new Error(
            "You are not allowed to consume this protected data. You need to rent it first, or to subscribe to the user's collection."
          )
        );
      },
      timeouts.protectData +
        timeouts.createCollection +
        timeouts.addToCollection +
        timeouts.consumeProtectedData
    );

    if (ENV === 'bellecour-fork') {
      describe('use voucher', () => {
        it(
          'should throw error if no voucher available for the requester',
          async () => {
            const walletConsumer1 = Wallet.createRandom();
            const dataProtectorConsumer1 = new IExecDataProtector(
              ...getTestConfig(walletConsumer1.privateKey)
            );
            let error;
            try {
              await dataProtectorConsumer1.sharing.consumeProtectedData({
                app: DEFAULT_PROTECTED_DATA_DELIVERY_APP,
                protectedData,
                workerpool: TEST_CHAIN.debugWorkerpool,
                maxPrice: 1000,
                useVoucher: true,
              });
            } catch (err) {
              error = err;
            }
            expect(error).toBeDefined();
            expect(error.message).toBe(
              'Sharing smart contract: Failed to consume protected data'
            );
            expect(error.cause.message).toBe(
              `No Voucher found for address ${walletConsumer1.address}`
            );
          },
          timeouts.consumeProtectedData
        );

        it(
          'should throw error if sharing contract is not authorized to use voucher',
          async () => {
            const walletConsumer1 = Wallet.createRandom();
            const dataProtectorConsumer1 = new IExecDataProtector(
              ...getTestConfig(walletConsumer1.privateKey)
            );
            const voucherTypeId = await createVoucherType({
              description: 'test voucher type',
              duration: 60 * 60,
            });
            const voucherAddress = await createVoucher({
              owner: walletConsumer1.address,
              voucherType: voucherTypeId,
              value: 1000_000,
            });

            let error;
            try {
              await dataProtectorConsumer1.sharing.consumeProtectedData({
                app: DEFAULT_PROTECTED_DATA_DELIVERY_APP,
                protectedData,
                workerpool: TEST_CHAIN.debugWorkerpool,
                maxPrice: 1000,
                useVoucher: true,
              });
            } catch (err) {
              error = err;
            }
            expect(error).toBeDefined();
            expect(error.message).toBe(
              'Sharing smart contract: Failed to consume protected data'
            );
            expect(error.cause.message).toBe(
              `The sharing contract (${DEFAULT_SHARING_CONTRACT_ADDRESS}) is not authorized to use the voucher ${voucherAddress}. Please authorize it to use the voucher.`
            );
          },
          timeouts.createVoucherType +
            timeouts.createVoucher +
            timeouts.consumeProtectedData
        );

        it(
          'should throw error if workerpool is not sponsored by the voucher',
          async () => {
            const walletConsumer1 = Wallet.createRandom();
            const dataProtectorConsumer1 = new IExecDataProtector(
              ...getTestConfig(walletConsumer1.privateKey)
            );
            const voucherTypeId = await createVoucherType({
              description: 'test voucher type',
              duration: 60 * 60,
            });
            const voucherAddress = await createVoucher({
              owner: walletConsumer1.address,
              voucherType: voucherTypeId,
              value: 1000_000,
            });

            // authorize sharing smart contract to use voucher
            const ethProvider = utils.getSignerFromPrivateKey(
              TEST_CHAIN.rpcURL,
              walletConsumer1.privateKey
            );
            const iexec = new IExec({ ethProvider }, getTestIExecOption());
            await iexec.voucher.authorizeRequester(
              DEFAULT_SHARING_CONTRACT_ADDRESS
            );

            let error;
            try {
              await dataProtectorConsumer1.sharing.consumeProtectedData({
                app: DEFAULT_PROTECTED_DATA_DELIVERY_APP,
                protectedData,
                workerpool: TEST_CHAIN.debugWorkerpool,
                maxPrice: 1000,
                useVoucher: true,
              });
            } catch (err) {
              error = err;
            }
            expect(error).toBeDefined();
            expect(error.message).toBe(
              'Sharing smart contract: Failed to consume protected data'
            );
            expect(error.cause.message).toBe(
              `${TEST_CHAIN.debugWorkerpool} is not sponsored by the voucher ${voucherAddress}`
            );
          },
          timeouts.createVoucherType +
            timeouts.createVoucher +
            2 * timeouts.tx + // authorizeRequester
            timeouts.consumeProtectedData
        );

        it(
          'throw error if voucher balance is insufficient to sponsor workerpool',
          async () => {
            const walletConsumer1 = Wallet.createRandom();
            const dataProtectorConsumer1 = new IExecDataProtector(
              ...getTestConfig(walletConsumer1.privateKey)
            );
            const ethProvider = utils.getSignerFromPrivateKey(
              TEST_CHAIN.rpcURL,
              walletConsumer1.privateKey
            );
            const iexec = new IExec({ ethProvider }, getTestIExecOption());

            const voucherTypeId = await createVoucherType({
              description: 'test voucher type',
              duration: 60 * 60,
            });
            const debugWorkerpoolAddress = await iexec.ens.resolveName(
              TEST_CHAIN.debugWorkerpool
            );
            await addVoucherEligibleAsset(
              debugWorkerpoolAddress,
              voucherTypeId
            );
            const voucherValue = 500;
            await createVoucher({
              owner: walletConsumer1.address,
              voucherType: voucherTypeId,
              value: voucherValue,
            });

            // authorize sharing smart contract to use voucher
            await iexec.voucher.authorizeRequester(
              DEFAULT_SHARING_CONTRACT_ADDRESS
            );

            const missingAmount = workerpoolPrice - voucherValue;
            let error;
            try {
              await dataProtectorConsumer1.sharing.consumeProtectedData({
                app: DEFAULT_PROTECTED_DATA_DELIVERY_APP,
                protectedData,
                workerpool: TEST_CHAIN.debugWorkerpool,
                maxPrice: 1000,
                useVoucher: true,
              });
            } catch (err) {
              error = err;
            }
            expect(error).toBeDefined();
            expect(error.message).toBe(
              'Sharing smart contract: Failed to consume protected data'
            );
            expect(error.cause.message).toBe(
              `Voucher balance is insufficient to sponsor workerpool. Please approve an additional ${missingAmount} for voucher usage.`
            );
          },
          timeouts.createVoucherType +
            timeouts.createVoucher +
            timeouts.addEligibleAsset +
            2 * timeouts.tx + // authorizeRequester
            timeouts.consumeProtectedData
        );
        // TODO: enable the test once sharing smart contract match order using user account to cover missing amount
        it.skip(
          'should create deal if voucher balance is insufficient to sponsor workerpool and user approve missing amount',
          async () => {
            const walletConsumer1 = Wallet.createRandom();
            const dataProtectorConsumer1 = new IExecDataProtector(
              ...getTestConfig(walletConsumer1.privateKey)
            );
            const ethProvider = utils.getSignerFromPrivateKey(
              TEST_CHAIN.rpcURL,
              walletConsumer1.privateKey
            );
            const iexec = new IExec({ ethProvider }, getTestIExecOption());

            const voucherTypeId = await createVoucherType({
              description: 'test voucher type',
              duration: 60 * 60,
            });
            const debugWorkerpoolAddress = await iexec.ens.resolveName(
              TEST_CHAIN.debugWorkerpool
            );
            await addVoucherEligibleAsset(
              debugWorkerpoolAddress,
              voucherTypeId
            );
            const voucherAddress = await createVoucher({
              owner: walletConsumer1.address,
              voucherType: voucherTypeId,
              value: 500,
            });

            // authorize sharing smart contract to use voucher
            await iexec.voucher.authorizeRequester(
              DEFAULT_SHARING_CONTRACT_ADDRESS
            );
            await setNRlcBalance(walletConsumer1.address, 700);
            await iexec.account.deposit(700);
            await iexec.account.approve(500, voucherAddress);

            let testResolve;
            const testPromise = new Promise((resolve) => {
              testResolve = resolve;
            });

            const updateStatus = [];
            const onStatusUpdate = ({ title, isDone, payload }) => {
              updateStatus.push({ title, isDone, payload });
              if (title === 'CONSUME_TASK') {
                testResolve();
              }
            };

            dataProtectorConsumer1.sharing.consumeProtectedData({
              app: DEFAULT_PROTECTED_DATA_DELIVERY_APP,
              protectedData,
              workerpool: TEST_CHAIN.debugWorkerpool,
              maxPrice: 1000,
              useVoucher: true,
              onStatusUpdate,
            });

            await testPromise; // wait for the manual resolution
            expect(updateStatus[5].title).toBe('CONSUME_ORDER_REQUESTED');
            expect(updateStatus[5].isDone).toBe(true);
            expect(updateStatus[5].payload.txHash).toBeDefined();
            expect(updateStatus[6].title).toBe('CONSUME_TASK');
            expect(updateStatus[6].payload.dealId).toBeDefined();
            expect(updateStatus[6].payload.taskId).toBeDefined();
          },
          timeouts.createVoucherType +
            timeouts.createVoucher +
            timeouts.addEligibleAsset +
            2 * timeouts.tx + // authorizeRequester
            2 * timeouts.tx + // deposit
            5 * timeouts.tx + // approve
            timeouts.consumeProtectedData
        );

        it(
          'should create a deal for consume protected data if voucher balance is sufficient to sponsor workerpool',
          async () => {
            const walletConsumer1 = Wallet.createRandom();
            const dataProtectorConsumer1 = new IExecDataProtector(
              ...getTestConfig(walletConsumer1.privateKey)
            );
            await dataProtectorConsumer1.sharing.subscribeToCollection({
              collectionId,
              ...subscriptionParams,
            });
            const ethProvider = utils.getSignerFromPrivateKey(
              TEST_CHAIN.rpcURL,
              walletConsumer1.privateKey
            );
            const iexec = new IExec({ ethProvider }, getTestIExecOption());

            const voucherTypeId = await createVoucherType({
              description: 'test voucher type',
              duration: 60 * 60,
            });
            const debugWorkerpoolAddress = await iexec.ens.resolveName(
              TEST_CHAIN.debugWorkerpool
            );
            await addVoucherEligibleAsset(
              debugWorkerpoolAddress,
              voucherTypeId
            );
            await createVoucher({
              owner: walletConsumer1.address,
              voucherType: voucherTypeId,
              value: 1000_000,
            });

            // authorize sharing smart contract to use voucher
            await iexec.voucher.authorizeRequester(
              DEFAULT_SHARING_CONTRACT_ADDRESS
            );

            let testResolve;
            const testPromise = new Promise((resolve) => {
              testResolve = resolve;
            });

            const consumeProtectedDataStatus = [];
            const onStatusUpdate = ({ title, isDone, payload }) => {
              consumeProtectedDataStatus.push({ title, isDone, payload });
              if (title === 'CONSUME_TASK') {
                testResolve();
              }
            };

            dataProtectorConsumer1.sharing.consumeProtectedData({
              app: DEFAULT_PROTECTED_DATA_DELIVERY_APP,
              protectedData,
              workerpool: TEST_CHAIN.debugWorkerpool,
              maxPrice: 1000,
              useVoucher: true,
              onStatusUpdate,
            });

            await testPromise; // wait for the manual resolution
            expect(consumeProtectedDataStatus[5].title).toBe(
              'CONSUME_ORDER_REQUESTED'
            );
            expect(consumeProtectedDataStatus[5].isDone).toBe(true);
            expect(consumeProtectedDataStatus[5].payload.txHash).toBeDefined();
            expect(consumeProtectedDataStatus[6].title).toBe('CONSUME_TASK');
            expect(consumeProtectedDataStatus[6].payload.dealId).toBeDefined();
            expect(consumeProtectedDataStatus[6].payload.taskId).toBeDefined();
          },
          timeouts.createVoucherType +
            timeouts.createVoucher +
            timeouts.addEligibleAsset +
            2 * timeouts.tx + // authorizeRequester
            timeouts.consumeProtectedData
        );
      });
    } else {
      console.log(`Voucher not yet deployed in [${ENV}] environment`);
      test('placeholder test', () => {
        expect(true).toBe(true);
      });
    }
  });
});
