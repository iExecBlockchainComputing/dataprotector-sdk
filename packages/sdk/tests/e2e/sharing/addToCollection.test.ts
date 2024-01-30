import { beforeAll, describe, expect, jest, it } from '@jest/globals';
import { Wallet, type HDNodeWallet } from 'ethers';
import { getWeb3Provider, IExecDataProtector } from '../../../src/index.js';
import { ValidationError } from '../../../src/utils/errors.js';

describe('dataProtector.addToCollection()', () => {
  let dataProtector: IExecDataProtector;
  let wallet: HDNodeWallet;

  beforeAll(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtector(getWeb3Provider(wallet.privateKey));
  });

  describe('When calling addToCollection()', () => {
    it('should work', async () => {
      // --- GIVEN
      console.log('Create protected data...');
      const { address: protectedDataAddress } = await dataProtector.protectData(
        {
          data: { doNotUse: 'test' },
          name: 'test addToCollection',
        }
      );
      console.log('Protected data created:', protectedDataAddress);

      console.log('Create collection...');
      const { collectionId } = await dataProtector.createCollection();
      console.log('Collection created:', collectionId);

      const onStatusUpdateMock = jest.fn(
        (status: { title: string; isDone: boolean }) => {
          console.log(status.title, '-> isDone:', status.isDone);
        }
      );

      // --- WHEN
      await dataProtector.addToCollection({
        protectedDataAddress,
        collectionId,
        onStatusUpdate: onStatusUpdateMock,
      });

      // --- THEN
      expect(true).toBe(true);
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

  describe('When given collection does NOT exist', () => {
    it('should throw an error', async () => {
      // --- GIVEN
      console.log('Create protected data...');
      const { address: protectedDataAddress } = await dataProtector.protectData(
        {
          data: { doNotUse: 'test' },
          name: 'test addToCollection',
        }
      );
      console.log('Protected data created:', protectedDataAddress);

      // Increment this value as needed
      const collectionIdThatDoesNotExist = 9999999;

      // --- WHEN / THEN
      await expect(
        dataProtector.addToCollection({
          protectedDataAddress,
          collectionId: collectionIdThatDoesNotExist,
        })
      ).rejects.toThrow(
        new ValidationError(
          'Sharing smart contract: Failed to add protected data to collection'
        )
      );
    }, 120_000);
  });
});
