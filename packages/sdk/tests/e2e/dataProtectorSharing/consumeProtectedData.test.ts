import { beforeAll, describe, expect, jest, it } from '@jest/globals';
import { Wallet, type HDNodeWallet } from 'ethers';
import { getWeb3Provider, IExecDataProtector } from '../../../src/index.js';
import {
  MAX_EXPECTED_BLOCKTIME,
  MAX_EXPECTED_WEB2_SERVICES_TIME,
  waitForSubgraphIndexing,
} from '../../test-utils.js';

describe('dataProtector.consumeProtectedData()', () => {
  let dataProtector: IExecDataProtector;
  let wallet: HDNodeWallet;

  beforeAll(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtector(getWeb3Provider(wallet.privateKey));
  });

  describe('When calling consumeProtectedData() with valid inputs', () => {
    it(
      'should work',
      async () => {
        // --- GIVEN
        const { address: protectedDataAddress } =
          await dataProtector.dataProtector.protectData({
            data: { doNotUse: 'test' },
            name: 'test addToCollection',
          });
        const { collectionTokenId } =
          await dataProtector.dataProtectorSharing.createCollection();

        await dataProtector.dataProtectorSharing.addToCollection({
          collectionTokenId,
          protectedDataAddress,
        });
        await waitForSubgraphIndexing();

        await dataProtector.dataProtectorSharing.setProtectedDataToSubscription(
          {
            protectedDataAddress,
          }
        );
        await waitForSubgraphIndexing();

        const priceInNRLC = BigInt('0');
        const durationInSeconds = 86400; // 24h
        await dataProtector.dataProtectorSharing.setSubscriptionParams({
          collectionTokenId,
          priceInNRLC,
          durationInSeconds,
        });
        await waitForSubgraphIndexing();

        await dataProtector.dataProtectorSharing.subscribe({
          collectionTokenId,
        });
        await waitForSubgraphIndexing();

        // --- WHEN
        const onStatusUpdateMock = jest.fn();
        const test =
          await dataProtector.dataProtectorSharing.consumeProtectedData({
            protectedDataAddress,
            onStatusUpdate: onStatusUpdateMock,
          });
        console.log(test);
        // --- THEN
        expect(onStatusUpdateMock).toHaveBeenCalledWith({
          title: 'PROTECTED_DATA_CONSUMED',
          isDone: true,
        });
      },
      8 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
    );
  });

  describe('When calling consumeProtectedData() with invalid rentals or subscriptions', () => {
    it(
      'should work',
      async () => {
        // --- GIVEN
        const { address: protectedDataAddress } =
          await dataProtector.dataProtector.protectData({
            data: { doNotUse: 'test' },
            name: 'test addToCollection',
          });
        const { collectionTokenId } =
          await dataProtector.dataProtectorSharing.createCollection();

        await dataProtector.dataProtectorSharing.addToCollection({
          collectionTokenId,
          protectedDataAddress,
        });
        await waitForSubgraphIndexing();

        // --- WHEN  --- THEN
        await expect(
          dataProtector.dataProtectorSharing.consumeProtectedData({
            protectedDataAddress,
          })
        ).rejects.toThrow(
          new Error("You didn't have valid subscription or rentals")
        );
      },
      8 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
    );
  });
});
