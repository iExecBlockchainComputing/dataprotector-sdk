import { beforeAll, describe, expect, it } from '@jest/globals';
import { Wallet, type HDNodeWallet } from 'ethers';
import { IExecDataProtector, getWeb3Provider } from '../../../src/index.js';
import { waitForSubgraphIndexing } from '../../unit/utils/waitForSubgraphIndexing.js';
import {
  MAX_EXPECTED_BLOCKTIME,
  MAX_EXPECTED_WEB2_SERVICES_TIME,
} from '../../test-utils.js';

describe('dataProtector.getProtectedDataInCollections()', () => {
  let dataProtector: IExecDataProtector;
  let wallet: HDNodeWallet;

  beforeAll(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtector(getWeb3Provider(wallet.privateKey));
  });

  describe('When calling getProtectedDataInCollections() with collectionTokenId', () => {
    it(
      'should work',
      async () => {
        const { collectionTokenId } =
          await dataProtector.dataProtectorSharing.createCollection();
        await waitForSubgraphIndexing();

        const { address: protectedDataAddress1 } =
          await dataProtector.dataProtector.protectData({
            data: { doNotUse: 'test' },
            name: 'test addToCollection',
          });
        const { address: protectedDataAddress2 } =
          await dataProtector.dataProtector.protectData({
            data: { doNotUse: 'test' },
            name: 'test addToCollection',
          });

        await dataProtector.dataProtectorSharing.addToCollection({
          collectionTokenId,
          protectedDataAddress: protectedDataAddress1,
        });
        await dataProtector.dataProtectorSharing.addToCollection({
          collectionTokenId,
          protectedDataAddress: protectedDataAddress2,
        });
        await waitForSubgraphIndexing();

        const result =
          await dataProtector.dataProtectorSharing.getProtectedDataInCollections(
            {
              collectionTokenId,
            }
          );

        expect(result.length).toBe(2);
      },
      10 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
    );
  });

  describe('When calling getProtectedDataInCollections() with collectionOwner', () => {
    it(
      'should work',
      async () => {
        const { collectionTokenId } =
          await dataProtector.dataProtectorSharing.createCollection();
        await waitForSubgraphIndexing();

        const { address: protectedDataAddress1 } =
          await dataProtector.dataProtector.protectData({
            data: { doNotUse: 'test' },
            name: 'test addToCollection',
          });
        const { address: protectedDataAddress2 } =
          await dataProtector.dataProtector.protectData({
            data: { doNotUse: 'test' },
            name: 'test addToCollection',
          });

        await dataProtector.dataProtectorSharing.addToCollection({
          collectionTokenId,
          protectedDataAddress: protectedDataAddress1,
        });
        await dataProtector.dataProtectorSharing.addToCollection({
          collectionTokenId,
          protectedDataAddress: protectedDataAddress2,
        });
        await waitForSubgraphIndexing();

        const result =
          await dataProtector.dataProtectorSharing.getProtectedDataInCollections(
            {
              collectionTokenId,
              collectionOwner: wallet.address,
            }
          );

        expect(result.length).toBe(2);
      },
      10 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
    );
  });
});
