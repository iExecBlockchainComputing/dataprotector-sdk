import { beforeAll, describe, expect, jest, it } from '@jest/globals';
import { Wallet, type HDNodeWallet } from 'ethers';
import { getWeb3Provider, IExecDataProtector } from '../../../src/index.js';
import { waitForSubgraphIndexing } from '../../test-utils.js';

describe('dataProtector.addToCollection()', () => {
  let dataProtector: IExecDataProtector;
  let wallet: HDNodeWallet;

  beforeAll(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtector(getWeb3Provider(wallet.privateKey));
  });

  describe('When calling addToCollection() with valid inputs', () => {
    it('should work', async () => {
      // --- GIVEN
      const { address: protectedDataAddress } =
        await dataProtector.dataProtector.protectData({
          data: { doNotUse: 'test' },
          name: 'test addToCollection',
        });
      const { collectionTokenId } =
        await dataProtector.dataProtectorSharing.createCollection();

      const onStatusUpdateMock = jest.fn();

      await dataProtector.dataProtectorSharing.addToCollection({
        collectionTokenId,
        protectedDataAddress,
        onStatusUpdate: onStatusUpdateMock,
      });
      await waitForSubgraphIndexing();

      const priceInNRLC = BigInt('0');
      const durationInSeconds = 2000;
      await dataProtector.dataProtectorSharing.setSubscriptionParams({
        collectionTokenId,
        priceInNRLC,
        durationInSeconds,
      });

      // --- WHEN
      await dataProtector.dataProtectorSharing.consumeProtectedData({
        protectedDataAddress,
        onStatusUpdate: onStatusUpdateMock,
      });

      // --- THEN
      expect(onStatusUpdateMock).toHaveBeenCalledWith({
        title: 'PROTECTED_DATA_CONSUMED',
        isDone: true,
      });
    }, 120_000);
  });
});
