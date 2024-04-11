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

  describe('When calling getProtectedDataInCollections() with collectionId', () => {
    it(
      'should work',
      async () => {
        // --- GIVEN
        const { collectionId } = await dataProtector.sharing.createCollection();
        await waitForSubgraphIndexing();

        const { address: protectedData1 } =
          await dataProtector.core.protectData({
            data: { doNotUse: 'test' },
            name: 'test addToCollection',
          });
        const { address: protectedData2 } =
          await dataProtector.core.protectData({
            data: { doNotUse: 'test' },
            name: 'test addToCollection',
          });
        // --- WHEN
        await dataProtector.sharing.addToCollection({
          collectionId,
          protectedData: protectedData1,
        });
        await dataProtector.sharing.addToCollection({
          collectionId,
          protectedData: protectedData2,
        });
        await waitForSubgraphIndexing();

        const result =
          await dataProtector.sharing.getProtectedDataInCollections({
            collectionId,
          });
        // --- THEN
        expect(result.protectedDataInCollection.length).toBe(2);
      },
      10 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
    );
  });

  describe('When calling getProtectedDataInCollections() with collectionOwner', () => {
    it(
      'should work',
      async () => {
        // --- GIVEN
        const { collectionId } = await dataProtector.sharing.createCollection();
        await waitForSubgraphIndexing();

        const { address: protectedData1 } =
          await dataProtector.core.protectData({
            data: { doNotUse: 'test' },
            name: 'test addToCollection',
          });
        const { address: protectedData2 } =
          await dataProtector.core.protectData({
            data: { doNotUse: 'test' },
            name: 'test addToCollection',
          });
        // --- WHEN
        await dataProtector.sharing.addToCollection({
          collectionId,
          protectedData: protectedData1,
        });
        await dataProtector.sharing.addToCollection({
          collectionId,
          protectedData: protectedData2,
        });
        await waitForSubgraphIndexing();
        const timeStamp = 0;
        const page = 0;
        const pageSize = 10;
        const result =
          await dataProtector.sharing.getProtectedDataInCollections({
            createdAfterTimestamp: timeStamp,
            page: page,
            pageSize: pageSize,
            collectionId,
            collectionOwner: wallet.address,
          });
        // --- THEN
        expect(result.protectedDataInCollection.length).toBe(2);
      },
      10 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
    );
  });

  describe('When calling getProtectedDataInCollections() with invalid collectionID', () => {
    it(
      'should throw a validation error',
      async () => {
        // --- GIVEN
        const invalidTokenId = -1;
        // --- WHEN / THEN
        await expect(
          dataProtector.sharing.getProtectedDataInCollections({
            collectionId: invalidTokenId,
            collectionOwner: wallet.address,
          })
        ).rejects.toThrow(
          new Error('collectionId must be greater than or equal to 0')
        );
      },
      2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
    );
  });

  describe('When calling getProtectedDataInCollections() with invalid collection owner', () => {
    it(
      'should throw a validation error',
      async () => {
        // --- GIVEN
        const validTokenId = 50;
        const invalidCollectionOwner = '0x123...';
        // --- WHEN / THEN
        await expect(
          dataProtector.sharing.getProtectedDataInCollections({
            collectionId: validTokenId,
            collectionOwner: invalidCollectionOwner,
          })
        ).rejects.toThrow(
          new Error('collectionOwner should be an ethereum address')
        );
      },
      2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
    );
  });

  describe('When calling getProtectedDataInCollections() with invalid page', () => {
    it(
      'should throw a validation error',
      async () => {
        // --- GIVEN
        const { collectionId } = await dataProtector.sharing.createCollection();
        await waitForSubgraphIndexing();

        const { address: protectedData1 } =
          await dataProtector.core.protectData({
            data: { doNotUse: 'test' },
            name: 'test addToCollection',
          });
        const { address: protectedData2 } =
          await dataProtector.core.protectData({
            data: { doNotUse: 'test' },
            name: 'test addToCollection',
          });

        await dataProtector.sharing.addToCollection({
          collectionId,
          protectedData: protectedData1,
        });
        await dataProtector.sharing.addToCollection({
          collectionId,
          protectedData: protectedData2,
        });
        await waitForSubgraphIndexing();

        const invalidPage = -1;
        // --- WHEN / THEN
        await expect(
          dataProtector.sharing.getProtectedDataInCollections({
            page: invalidPage,
            collectionId,
          })
        ).rejects.toThrow(new Error('page must be greater than or equal to 0'));
      },
      10 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
    );
  });

  describe('When calling getProtectedDataInCollections() with invalid pagesize', () => {
    it(
      'should throw a validation error',
      async () => {
        // --- GIVEN
        const { collectionId } = await dataProtector.sharing.createCollection();
        await waitForSubgraphIndexing();

        const { address: protectedData1 } =
          await dataProtector.core.protectData({
            data: { doNotUse: 'test' },
            name: 'test addToCollection',
          });
        const { address: protectedData2 } =
          await dataProtector.core.protectData({
            data: { doNotUse: 'test' },
            name: 'test addToCollection',
          });

        await dataProtector.sharing.addToCollection({
          collectionId,
          protectedData: protectedData1,
        });
        await dataProtector.sharing.addToCollection({
          collectionId,
          protectedData: protectedData2,
        });
        await waitForSubgraphIndexing();

        const invalidPageSize = -1;
        // --- WHEN / THEN
        await expect(
          dataProtector.sharing.getProtectedDataInCollections({
            pageSize: invalidPageSize,
            collectionId,
          })
        ).rejects.toThrow(
          new Error('pageSize must be greater than or equal to 10')
        );
      },
      10 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
    );
  });
});
