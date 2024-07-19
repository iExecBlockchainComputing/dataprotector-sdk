import { beforeAll, describe, expect, it, jest } from '@jest/globals';
import { Wallet } from 'ethers';
import { utils } from 'iexec';
import { IExecDataProtector } from '../../../src/index.js';
import { timeouts } from '../../test-utils.js';

const WORKERPOOL_ADDRESS = 'prod-stagingv8.main.pools.iexec.eth';

// this test can't run in drone ci need VPN because is based on iexec protocol, unskip it when desired
describe.skip('dataProtector.consumeProtectedData()', () => {
  let dataProtectorCreator: IExecDataProtector;
  let dataProtectorConsumer: IExecDataProtector;
  const DEFAULT_PROTECTED_DATA_DELIVERY_APP =
    '0x85795d8Eb2B5D39A6E8dfB7890924191B3D1Ccf6';
  let addOnlyAppWhitelist: string;

  beforeAll(async () => {
    const walletCreator = Wallet.createRandom();
    const walletConsumer = Wallet.createRandom();

    // iexecOptions for staging
    const iexecOptions = {
      smsURL: 'https://sms.scone-prod.stagingv8.iex.ec',
      ipfsGatewayURL: 'https://ipfs-gateway.stagingv8.iex.ec',
      iexecGatewayURL: 'https://api.market.stagingv8.iex.ec',
      resultProxyURL: 'https://result.stagingv8.iex.ec',
    };

    const dataProtectorOptions = {
      iexecOptions: iexecOptions,
      ipfsGateway: 'https://ipfs-gateway.stagingv8.iex.ec',
      ipfsNode: 'https://ipfs-upload.stagingv8.iex.ec',
      subgraphUrl:
        'https://thegraph-product.iex.ec/subgraphs/name/bellecour/dev-dataprotector-v2',
    };

    const provider1 = utils.getSignerFromPrivateKey(
      'https://bellecour.iex.ec',
      walletCreator.privateKey
    );
    const provider2 = utils.getSignerFromPrivateKey(
      'https://bellecour.iex.ec',
      walletConsumer.privateKey
    );

    dataProtectorCreator = new IExecDataProtector(
      provider1,
      dataProtectorOptions
    );
    dataProtectorConsumer = new IExecDataProtector(
      provider2,
      dataProtectorOptions
    );

    const addOnlyAppWhitelistResponse =
      await dataProtectorCreator.sharing.createAddOnlyAppWhitelist();
    addOnlyAppWhitelist = addOnlyAppWhitelistResponse.addOnlyAppWhitelist;
  });

  describe('When calling consumeProtectedData() with valid inputs', () => {
    it(
      'should work',
      async () => {
        // --- GIVEN
        const { address: protectedData } =
          await dataProtectorCreator.core.protectData({
            data: { file: 'test' },
            name: 'consumeProtectedDataTest',
          });
        const { collectionId } =
          await dataProtectorCreator.sharing.createCollection();

        await dataProtectorCreator.sharing.addToCollection({
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

        // --- WHEN
        const onStatusUpdateMock = jest.fn();
        const result = await dataProtectorConsumer.sharing.consumeProtectedData(
          {
            app: DEFAULT_PROTECTED_DATA_DELIVERY_APP,
            protectedData,
            workerpool: WORKERPOOL_ADDRESS,
            onStatusUpdate: onStatusUpdateMock,
          }
        );

        // --- THEN
        expect(onStatusUpdateMock).toHaveBeenCalledWith({
          title: 'CONSUME_RESULT_COMPLETE',
          isDone: true,
        });
        console.log(result);
      },
      timeouts.protectData +
        timeouts.createCollection +
        timeouts.addToCollection +
        timeouts.setProtectedDataToSubscription +
        timeouts.setSubscriptionParams +
        timeouts.subscribe +
        timeouts.consumeProtectedData
    );
  });

  describe('When calling consumeProtectedData() with invalid rentals or subscriptions', () => {
    it(
      'should work',
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
