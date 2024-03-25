import { beforeAll, describe, expect, it } from '@jest/globals';
import { Wallet, type HDNodeWallet } from 'ethers';
import { IExecDataProtector } from '../../../src/index.js';
import { getTestConfig, timeouts } from '../../test-utils.js';

describe('dataProtector.setSubscriptionParams()', () => {
  let dataProtector: IExecDataProtector;
  let wallet: HDNodeWallet;

  beforeAll(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtector(...getTestConfig(wallet.privateKey));
  });

  describe('When calling setSubscriptionParams()', () => {
    it(
      'should answer with success true',
      async () => {
        const { collectionTokenId } =
          await dataProtector.sharing.createCollection();

        const setSubscriptionParamsResult =
          await dataProtector.sharing.setSubscriptionParams({
            collectionTokenId,
            priceInNRLC: 100,
            durationInSeconds: 2000,
          });

        expect(setSubscriptionParamsResult).toEqual({
          txHash: expect.any(String),
        });
      },
      timeouts.createCollection + timeouts.setSubscriptionParams
    );
  });

  describe('When calling setSubscriptionParams() with invalid collection ID', () => {
    it(
      'should throw the corresponding error',
      async () => {
        const collectionTokenId = -1;

        // --- WHEN / THEN
        await expect(
          dataProtector.sharing.setSubscriptionParams({
            collectionTokenId,
            priceInNRLC: 100,
            durationInSeconds: 2000,
          })
        ).rejects.toThrow(
          new Error('collectionTokenId must be greater than or equal to 0')
        );
      },
      timeouts.setSubscriptionParams
    );
  });

  describe('When calling setSubscriptionParams() with collection ID that does not exist', () => {
    it(
      'should throw the corresponding error',
      async () => {
        // Increment this value as needed
        const collectionTokenIdThatDoesNotExist = 9999999;

        // --- WHEN / THEN
        await expect(
          dataProtector.sharing.setSubscriptionParams({
            collectionTokenId: collectionTokenIdThatDoesNotExist,
            priceInNRLC: 100,
            durationInSeconds: 2000,
          })
        ).rejects.toThrow(
          new Error(
            'This collection does not seem to exist or it has been burned.'
          )
        );
      },
      timeouts.setSubscriptionParams
    );
  });
});
