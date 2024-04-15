import { beforeAll, describe, expect, it } from '@jest/globals';
import { Wallet, type HDNodeWallet } from 'ethers';
import { IExecDataProtector } from '../../../src/index.js';
import { getTestConfig, timeouts } from '../../test-utils.js';

describe('dataProtector.setProtectedDataToSubscription()', () => {
  let dataProtector: IExecDataProtector;
  let wallet: HDNodeWallet;

  beforeAll(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtector(...getTestConfig(wallet.privateKey));
  });

  describe('When calling setProtectedDataToSubscription()', () => {
    it(
      'should answer with success true',
      async () => {
        const result = await dataProtector.core.protectData({
          name: 'test',
          data: { doNotUse: 'test' },
        });

        const { collectionId } = await dataProtector.sharing.createCollection();

        await dataProtector.sharing.addToCollection({
          collectionId,
          protectedData: result.address,
        });

        const setProtectedDataToSubscriptionResult =
          await dataProtector.sharing.setProtectedDataToSubscription({
            protectedData: result.address,
          });
        expect(setProtectedDataToSubscriptionResult).toEqual({
          txHash: expect.any(String),
        });
      },
      timeouts.protectData +
        timeouts.createCollection +
        timeouts.addToCollection +
        timeouts.setProtectedDataToSubscription
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
          dataProtector.sharing.setProtectedDataToSubscription({
            protectedData: invalidProtectedData,
          })
        ).rejects.toThrow(
          new Error('protectedData should be an ethereum address or a ENS name')
        );
      },
      timeouts.setProtectedDataToSubscription
    );
  });

  describe('When the given protected data address is currently for sale', () => {
    it(
      'should throw with the corresponding error',
      async () => {
        // --- GIVEN
        const result = await dataProtector.core.protectData({
          name: 'test',
          data: { doNotUse: 'test' },
        });

        const { collectionId } = await dataProtector.sharing.createCollection();

        await dataProtector.sharing.addToCollection({
          collectionId,
          protectedData: result.address,
        });

        await dataProtector.sharing.setProtectedDataForSale({
          price: 200,
          protectedData: result.address,
        });
        // --- WHEN / THEN
        await expect(
          dataProtector.sharing.setProtectedDataToSubscription({
            protectedData: result.address,
          })
        ).rejects.toThrow(
          new Error(
            'This protected data is currently available for sale. First call removeProtectedDataForSale()'
          )
        );
      },
      timeouts.protectData +
        timeouts.createCollection +
        timeouts.addToCollection +
        timeouts.setProtectedDataForSale +
        timeouts.setProtectedDataToSubscription
    );
  });

  describe('When the given protected data address is included in a subscription', () => {
    it(
      'should throw with the corresponding error',
      async () => {
        // --- GIVEN
        const result = await dataProtector.core.protectData({
          name: 'test',
          data: { doNotUse: 'test' },
        });

        const { collectionId } = await dataProtector.sharing.createCollection();

        await dataProtector.sharing.addToCollection({
          collectionId,
          protectedData: result.address,
        });
        await dataProtector.sharing.setProtectedDataToSubscription({
          protectedData: result.address,
        });
        // --- WHEN / THEN
        await expect(
          dataProtector.sharing.setProtectedDataToSubscription({
            protectedData: result.address,
          })
        ).rejects.toThrow(
          new Error(
            'This protected data is currently included in your subscription. First call removeProtectedDataFromSubscription()'
          )
        );
      },
      timeouts.protectData +
        timeouts.createCollection +
        timeouts.addToCollection +
        2 * timeouts.setProtectedDataToSubscription
    );
  });
});
