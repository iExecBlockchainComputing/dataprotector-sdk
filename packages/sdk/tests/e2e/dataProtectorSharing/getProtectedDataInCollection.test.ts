import { beforeAll, describe, expect, it } from '@jest/globals';
import { Wallet, type HDNodeWallet } from 'ethers';
import { IExecDataProtector } from '../../../src/index.js';
import {
  MAX_EXPECTED_BLOCKTIME,
  MAX_EXPECTED_WEB2_SERVICES_TIME,
  getTestConfig,
} from '../../test-utils.js';
import { waitForSubgraphIndexing } from '../../unit/utils/waitForSubgraphIndexing.js';

describe('dataProtector.getProtectedDataInCollections()', () => {
  let dataProtector: IExecDataProtector;
  let wallet: HDNodeWallet;

  beforeAll(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtector(...getTestConfig(wallet.privateKey));
  });

  describe('When calling getProtectedDataInCollections() with collectionTokenId', () => {
    it(
      'should work',
      async () => {
        const { collectionTokenId } =
          await dataProtector.sharing.createCollection();
        await waitForSubgraphIndexing();

        const { address: protectedDataAddress1 } =
          await dataProtector.core.protectData({
            data: { doNotUse: 'test' },
            name: 'test addToCollection',
          });
        const { address: protectedDataAddress2 } =
          await dataProtector.core.protectData({
            data: { doNotUse: 'test' },
            name: 'test addToCollection',
          });

        await dataProtector.sharing.addToCollection({
          collectionTokenId,
          protectedDataAddress: protectedDataAddress1,
        });
        await dataProtector.sharing.addToCollection({
          collectionTokenId,
          protectedDataAddress: protectedDataAddress2,
        });
        await waitForSubgraphIndexing();

        const result =
          await dataProtector.sharing.getProtectedDataInCollections({
            collectionTokenId,
          });

        expect(result.protectedDataInCollection.length).toBe(2);
      },
      10 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
    );
  });

  describe('When calling getProtectedDataInCollections() with collectionOwner', () => {
    it(
      'should work',
      async () => {
        const { collectionTokenId } =
          await dataProtector.sharing.createCollection();
        await waitForSubgraphIndexing();

        const { address: protectedDataAddress1 } =
          await dataProtector.core.protectData({
            data: { doNotUse: 'test' },
            name: 'test addToCollection',
          });
        const { address: protectedDataAddress2 } =
          await dataProtector.core.protectData({
            data: { doNotUse: 'test' },
            name: 'test addToCollection',
          });

        await dataProtector.sharing.addToCollection({
          collectionTokenId,
          protectedDataAddress: protectedDataAddress1,
        });
        await dataProtector.sharing.addToCollection({
          collectionTokenId,
          protectedDataAddress: protectedDataAddress2,
        });
        await waitForSubgraphIndexing();

        const result =
          await dataProtector.sharing.getProtectedDataInCollections({
            collectionTokenId,
            collectionOwner: wallet.address,
          });

        expect(result.protectedDataInCollection.length).toBe(2);
      },
      10 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
    );
  });
});
