import { beforeAll, describe, expect, it } from '@jest/globals';
import { Wallet } from 'ethers';
import { IExecDataProtector } from '../../../src/index.js';
import {
  MAX_EXPECTED_MARKET_API_PURGE_TIME,
  TEST_CHAIN,
  createAndPublishWorkerpoolOrder,
  getTestConfig,
  timeouts,
} from '../../test-utils.js';
import { WORKERPOOL_ADDRESS } from '../../../src/config/config.js';

const DEFAULT_PROTECTED_DATA_DELIVERY_APP =
  '0x85795d8Eb2B5D39A6E8dfB7890924191B3D1Ccf6';

// this test can't run in drone ci need VPN because is based on iexec protocol, unskip it when desired
describe('dataProtector.consumeProtectedData()', () => {
  let dataProtectorCreator: IExecDataProtector;
  let dataProtectorConsumer: IExecDataProtector;
  let addOnlyAppWhitelist: string;
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
  }, 3 * MAX_EXPECTED_MARKET_API_PURGE_TIME);

  describe('When whitelist contract does not have registered delivery app', () => {
    it(
      'should throw error',
      async () => {
        // --- GIVEN
        const { address: protectedData } =
          await dataProtectorCreator.core.protectData({
            data: { file: 'test' },
            name: 'consumeProtectedDataTest',
          });
        const { collectionId } =
          await dataProtectorCreator.sharing.createCollection();

        const res = await dataProtectorCreator.sharing.addToCollection({
          collectionId,
          addOnlyAppWhitelist,
          protectedData,
        });
        await dataProtectorCreator.sharing.setProtectedDataToSubscription({
          protectedData,
        });

        const subscriptionParams = { price: 0, duration: 86400 };
        await dataProtectorCreator.sharing.setSubscriptionParams({
          collectionId,
          ...subscriptionParams,
        });

        await dataProtectorConsumer.sharing.subscribeToCollection({
          collectionId,
          ...subscriptionParams,
        });
        const onStatusUpdate = ({ title, isDone, payload }) => {
          console.log(title, isDone, payload);
        };
        // --- WHEN
        await expect(
          dataProtectorConsumer.sharing.consumeProtectedData({
            app: DEFAULT_PROTECTED_DATA_DELIVERY_APP,
            protectedData,
            workerpool: WORKERPOOL_ADDRESS,
            maxPrice: 0,
            onStatusUpdate: onStatusUpdate,
          })
        ).rejects.toThrow(
          `This whitelist contract does not have registered this app: ${DEFAULT_PROTECTED_DATA_DELIVERY_APP.toLocaleLowerCase()}.`
        );
        // --- THEN
      },
      timeouts.protectData +
        timeouts.createCollection +
        timeouts.addToCollection +
        timeouts.setProtectedDataToSubscription +
        timeouts.setSubscriptionParams +
        timeouts.subscribe
    );
  });

  describe('When whitelist contract registered delivery app', () => {
    beforeAll(async () => {
      // add app 'protected-data-delivery-dapp-dev.apps.iexec.eth' to AppWhitelist SC
      await dataProtectorCreator.sharing.addAppToAddOnlyAppWhitelist({
        addOnlyAppWhitelist,
        app: DEFAULT_PROTECTED_DATA_DELIVERY_APP,
      });
    });

    it(
      'should work when calling consumeProtectedData() with valid inputs',
      async () => {
        // --- GIVEN
        const { address: protectedData } =
          await dataProtectorCreator.core.protectData({
            data: { file: 'test' },
            name: 'consumeProtectedDataTest',
          });
        const { collectionId } =
          await dataProtectorCreator.sharing.createCollection();

        const res = await dataProtectorCreator.sharing.addToCollection({
          collectionId,
          addOnlyAppWhitelist,
          protectedData,
        });
        await dataProtectorCreator.sharing.setProtectedDataToSubscription({
          protectedData,
        });
        // TODO : add test with price !== 0
        const subscriptionParams = { price: 0, duration: 86400 };
        await dataProtectorCreator.sharing.setSubscriptionParams({
          collectionId,
          ...subscriptionParams,
        });

        await dataProtectorConsumer.sharing.subscribeToCollection({
          collectionId,
          ...subscriptionParams,
        });

        await expect(
          dataProtectorConsumer.sharing.consumeProtectedData({
            protectedData,
            app: DEFAULT_PROTECTED_DATA_DELIVERY_APP,
          })
        ).rejects.toThrow(
          new Error('Sharing smart contract: Failed to consume protected data')
        );
        // TODO: Uncomment this part once a workerpool is deployed locally in TEE.
        // const onStatusUpdate = ({ title, isDone, payload }) => {
        //   console.log(title, isDone, payload);
        // };

        // --- WHEN
        // await dataProtectorConsumer.sharing.consumeProtectedData({
        //   app: DEFAULT_PROTECTED_DATA_DELIVERY_APP,
        //   protectedData,
        //   workerpool: WORKERPOOL_ADDRESS,
        //   maxPrice: 1000,
        //   onStatusUpdate: onStatusUpdate,
        // });

        // --- THEN

        // expect(onStatusUpdate).toHaveBeenCalledWith({
        //   title: 'PUSH_ENCRYPTION_KEY',
        //   isDone: true,
        // });

        // expect(onStatusUpdate).toHaveBeenCalledWith({
        //   title: 'CONSUME_ORDER_REQUESTED',
        //   isDone: true,
        // });
      },
      timeouts.protectData +
        timeouts.createCollection +
        timeouts.addToCollection +
        timeouts.setProtectedDataToSubscription +
        timeouts.setSubscriptionParams +
        timeouts.subscribe +
        timeouts.consumeProtectedData
    );
    it(
      'should throw error with invalid rentals or subscriptions',
      async () => {
        // --- GIVEN
        const { address: protectedData } =
          await dataProtectorCreator.core.protectData({
            data: { doNotUse: 'test' },
            name: 'test addToCollection',
          });
        const { collectionId } =
          await dataProtectorCreator.sharing.createCollection();

        await dataProtectorCreator.sharing.addToCollection({
          collectionId,
          protectedData,
          addOnlyAppWhitelist,
        });

        // --- WHEN  --- THEN
        await expect(
          dataProtectorConsumer.sharing.consumeProtectedData({
            protectedData,
            app: '0x82e41e1b594ccf69b0cfda25637eddc4e6d4e0fc',
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
  });
});
