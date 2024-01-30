import { beforeAll, describe, expect, jest, it } from '@jest/globals';
import { Wallet, type HDNodeWallet } from 'ethers';
import { getWeb3Provider, IExecDataProtector } from '../../../src/index.js';

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
      const { address: protectedDataAddress } = await dataProtector.protectData(
        {
          data: { doNotUse: 'test' },
          name: 'test addToCollection',
        }
      );

      const { collectionId } = await dataProtector.createCollection();

      const onStatusUpdateMock = jest.fn();

      // --- WHEN
      await dataProtector.addToCollection({
        protectedDataAddress,
        collectionId,
        onStatusUpdate: onStatusUpdateMock,
      });

      // --- THEN
      expect(onStatusUpdateMock).toHaveBeenCalledWith({
        title: 'Add protected data to your collection',
        isDone: true,
      });
    }, 120_000);
  });

  describe('When the given protected data does NOT exist', () => {
    it('should throw an error', async () => {
      // --- GIVEN
      const protectedDataAddressThatDoesNotExist =
        '0xbb673ac41acfbee381fe2e784d14c53b1cdc5946';
      const collectionIdThatDoesNotExist = 9999999;

      // --- WHEN / THEN
      await expect(
        dataProtector.addToCollection({
          protectedDataAddress: protectedDataAddressThatDoesNotExist,
          collectionId: collectionIdThatDoesNotExist,
        })
      ).rejects.toThrow(
        new Error('This protected data does not exist in the subgraph.')
      );
    });
  });

  describe('When the given collection does NOT exist', () => {
    it('should throw an error', async () => {
      // --- GIVEN
      const { address: protectedDataAddress } = await dataProtector.protectData(
        {
          data: { doNotUse: 'test' },
          name: 'test addToCollection',
        }
      );

      // Increment this value as needed
      const collectionIdThatDoesNotExist = 9999999;

      // --- WHEN / THEN
      await expect(
        dataProtector.addToCollection({
          protectedDataAddress,
          collectionId: collectionIdThatDoesNotExist,
        })
      ).rejects.toThrow(
        new Error(
          'This collection does not seem to exist in the "collection" smart-contract.'
        )
      );
    }, 120_000);
  });
});
