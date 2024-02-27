import { beforeAll, describe, expect, jest, it } from '@jest/globals';
import { Wallet, type HDNodeWallet } from 'ethers';
import { getWeb3Provider, IExecDataProtector } from '../../../src/index.js';
import { timeouts } from '../../test-utils.js';

describe('dataProtector.addToCollection()', () => {
  let dataProtector: IExecDataProtector;
  let wallet: HDNodeWallet;

  beforeAll(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtector(getWeb3Provider(wallet.privateKey));
  });

  describe('When calling addToCollection() with valid inputs', () => {
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

        const onStatusUpdateMock = jest.fn();

        // --- WHEN
        await dataProtector.dataProtectorSharing.addToCollection({
          collectionTokenId,
          protectedDataAddress,
          onStatusUpdate: onStatusUpdateMock,
        });

        // --- THEN
        expect(onStatusUpdateMock).toHaveBeenCalledWith({
          title: 'ADD_PROTECTED_DATA_TO_COLLECTION',
          isDone: true,
        });
      },
      timeouts.protectData +
        timeouts.createCollection +
        timeouts.addToCollection
    );
  });

  describe('When the given protected data does NOT exist', () => {
    it(
      'should throw an error',
      async () => {
        // --- GIVEN
        const protectedDataAddressThatDoesNotExist =
          '0xbb673ac41acfbee381fe2e784d14c53b1cdc5946';

        const { collectionTokenId } =
          await dataProtector.dataProtectorSharing.createCollection();

        // --- WHEN / THEN
        await expect(
          dataProtector.dataProtectorSharing.addToCollection({
            collectionTokenId,
            protectedDataAddress: protectedDataAddressThatDoesNotExist,
          })
        ).rejects.toThrow(
          new Error(
            'This protected Data does not seem to exist or it has been burned.'
          )
        );
      },
      timeouts.addToCollection
    );
  });

  describe('When the given collection does NOT exist', () => {
    it(
      'should throw an error',
      async () => {
        // --- GIVEN
        const { address: protectedDataAddress } =
          await dataProtector.dataProtector.protectData({
            data: { doNotUse: 'test' },
            name: 'test addToCollection',
          });

        // Increment this value as needed
        const collectionTokenIdThatDoesNotExist = 9999999;

        // --- WHEN / THEN
        await expect(
          dataProtector.dataProtectorSharing.addToCollection({
            collectionTokenId: collectionTokenIdThatDoesNotExist,
            protectedDataAddress,
          })
        ).rejects.toThrow(
          new Error(
            'This collection does not seem to exist or it has been burned.'
          )
        );
      },
      timeouts.protectData + timeouts.addToCollection
    );
  });
});
