import { beforeAll, describe, expect, it } from '@jest/globals';
import { Wallet } from 'ethers';
import { Address, IExec, utils } from 'iexec';
import {
  DEFAULT_SHARING_CONTRACT_ADDRESS,
  WORKERPOOL_ADDRESS,
} from '../../../src/config/config.js';
import { IExecDataProtector } from '../../../src/index.js';
import {
  TEST_CHAIN,
  addVoucherEligibleAsset,
  approveAccount,
  createAndPublishWorkerpoolOrder,
  createVoucher,
  createVoucherType,
  depositNRlcForAccount,
  getTestConfig,
  getTestIExecOption,
  timeouts,
} from '../../test-utils.js';

const DEFAULT_PROTECTED_DATA_DELIVERY_APP =
  'protected-data-delivery.apps.iexec.eth';

describe('dataProtector.consumeProtectedData()', () => {
  let dataProtectorCreator: IExecDataProtector;
  let dataProtectorConsumer: IExecDataProtector;
  let addOnlyAppWhitelist: string;
  let protectedData: Address;
  const walletCreator = Wallet.createRandom();
  const walletConsumer = Wallet.createRandom();

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
    await createAndPublishWorkerpoolOrder(
      TEST_CHAIN.prodWorkerpool,
      TEST_CHAIN.prodWorkerpoolOwnerWallet
    );

    const result = await dataProtectorCreator.core.protectData({
      data: { file: 'test' },
      name: 'consumeProtectedDataTest',
    });
    protectedData = result.address;
    const { collectionId } =
      await dataProtectorCreator.sharing.createCollection();

    await dataProtectorCreator.sharing.addToCollection({
      collectionId,
      addOnlyAppWhitelist,
      protectedData,
    });
    const subscriptionParams = { price: 0, duration: 2_592_000 };
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
        const ethProvider = utils.getSignerFromPrivateKey(
          TEST_CHAIN.rpcURL,
          walletConsumer.privateKey
        );
        const iexec = new IExec({ ethProvider }, getTestIExecOption());
        const protectedDataDeliveryAppAddress = await iexec.ens.resolveName(
          DEFAULT_PROTECTED_DATA_DELIVERY_APP
        );
        await expect(
          dataProtectorConsumer.sharing.consumeProtectedData({
            app: DEFAULT_PROTECTED_DATA_DELIVERY_APP,
            protectedData,
            workerpool: WORKERPOOL_ADDRESS,
            maxPrice: 1000,
          })
        ).rejects.toThrow(
          `This whitelist contract does not have registered this app: ${protectedDataDeliveryAppAddress.toLocaleLowerCase()}.`
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
        await depositNRlcForAccount(walletConsumer.address, 1000_000);
        await approveAccount(
          walletConsumer.privateKey,
          DEFAULT_SHARING_CONTRACT_ADDRESS,
          1000_000
        );
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
          workerpool: WORKERPOOL_ADDRESS,
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
        const { collectionId } =
          await dataProtectorCreator.sharing.createCollection();
        await dataProtectorCreator.sharing.addToCollection({
          collectionId,
          protectedData: protectedDataUnauthorizedToConsume,
          addOnlyAppWhitelist,
        });
        await expect(
          dataProtectorConsumer.sharing.consumeProtectedData({
            app: DEFAULT_PROTECTED_DATA_DELIVERY_APP,
            protectedData: protectedDataUnauthorizedToConsume,
            workerpool: WORKERPOOL_ADDRESS,
            maxPrice: 1000,
          })
        ).rejects.toThrow(
          new Error(
            "You are not allowed to consume this protected data. You need to rent it first, or to subscribe to the user's collection."
          )
        );
      },
      timeouts.consumeProtectedData
    );

    it(
      'use voucher - should throw error if no voucher available for the requester',
      async () => {
        let error;
        try {
          await dataProtectorConsumer.sharing.consumeProtectedData({
            app: DEFAULT_PROTECTED_DATA_DELIVERY_APP,
            protectedData,
            workerpool: WORKERPOOL_ADDRESS,
            maxPrice: 1000,
            useVoucher: true,
          });
        } catch (err) {
          error = err;
        }
        expect(error).toBeDefined();
        expect(error.message).toBe(
          `No Voucher found for address ${walletConsumer.address}`
        );
      },
      timeouts.consumeProtectedData
    );

    it(
      'use voucher - should create a deal for consume protected data',
      async () => {
        const voucherTypeId = await createVoucherType({
          description: 'test voucher type',
          duration: 60 * 60,
        });
        await addVoucherEligibleAsset(TEST_CHAIN.prodWorkerpool, voucherTypeId);
        await addVoucherEligibleAsset(
          DEFAULT_PROTECTED_DATA_DELIVERY_APP,
          voucherTypeId
        );
        await createVoucher({
          owner: walletConsumer.address,
          voucherType: voucherTypeId,
          value: 1000_000,
        });

        // authorize sharing smart contract to use voucher
        const ethProvider = utils.getSignerFromPrivateKey(
          TEST_CHAIN.rpcURL,
          walletConsumer.privateKey
        );
        const iexec = new IExec({ ethProvider }, getTestIExecOption());
        await iexec.voucher.authorizeRequester(
          DEFAULT_SHARING_CONTRACT_ADDRESS
        );

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

        dataProtectorConsumer.sharing.consumeProtectedData({
          app: DEFAULT_PROTECTED_DATA_DELIVERY_APP,
          protectedData,
          workerpool: WORKERPOOL_ADDRESS,
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
        2 * timeouts.addEligibleAsset + // app + workerpool
        2 * timeouts.tx + // authorizeRequester
        timeouts.consumeProtectedData
    );

    // TODO
    // it('use voucher - should throw error for insufficient voucher allowance', async () => {});
    // it('user voucher - should create a deal with voucher when user deposits to cover the missing amount', async () => {});
  });
});
