import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Wallet, type HDNodeWallet } from 'ethers';
import { IExecDataProtector, getWeb3Provider } from '../../../src/index.js';
import { WorkflowError } from '../../../src/utils/errors.js';
import {
  MAX_EXPECTED_BLOCKTIME,
  MAX_EXPECTED_WEB2_SERVICES_TIME,
  sleep,
} from '../../test-utils.js';

describe('dataProtector.removeProtectedDataFromRenting()', () => {
  let dataProtector: IExecDataProtector;
  let wallet: HDNodeWallet;

  beforeEach(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtector(getWeb3Provider(wallet.privateKey));
  });

  describe('When calling removeProtectedDataFromRenting()', () => {
    it(
      'should answer with success true',
      async () => {
        //Create a Protected data
        const result = await dataProtector.protectData({
          name: 'test',
          data: { doNotUse: 'test' },
        });
        //create collection
        const { collectionTokenId } = await dataProtector.createCollection();
        await sleep(2000);
        const onStatusUpdateMock = jest.fn();
        //add Protected Data To Collection
        await dataProtector.addToCollection({
          protectedDataAddress: result.address,
          collectionTokenId,
          onStatusUpdate: onStatusUpdateMock,
        });
        await sleep(2000);
        //Test price and duration values
        const price = BigInt('100');
        const duration = 2000;

        await dataProtector.setProtectedDataToRenting({
          protectedDataAddress: result.address,
          collectionTokenId: collectionTokenId,
          durationInSeconds: duration,
          priceInNRLC: price,
        });
        await sleep(2000);
        const { success } = await dataProtector.removeProtectedDataFromRenting({
          collectionTokenId: collectionTokenId,
          protectedDataAddress: result.address,
        });
        expect(success).toBe(true);
      },
      10 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
    );
    it(
      'should fail with collection does not exist error',
      async () => {
        //create a random protected data address
        const protectedDataAddressMock = Wallet.createRandom().address;
        //generate a random collection id that dosn't exist
        const min = 1000000;
        const max = Number.MAX_SAFE_INTEGER;
        const randomCollectionTokenId =
          Math.floor(Math.random() * (max - min + 1)) + min;
        await expect(() =>
          dataProtector.removeProtectedDataFromRenting({
            collectionTokenId: randomCollectionTokenId,
            protectedDataAddress: protectedDataAddressMock,
          })
        ).rejects.toThrow(
          new WorkflowError(
            'Failed to Remove Protected Data From Renting: collection does not exist.'
          )
        );
      },
      2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
    );
    it(
      'should fail with not collection owner error',
      async () => {
        //create a random protected data address
        const protectedDataAddressMock = Wallet.createRandom().address;
        //create collection
        const { collectionTokenId } = await dataProtector.createCollection();
        await sleep(2000);
        const wallet1 = Wallet.createRandom();
        const dataProtector1 = new IExecDataProtector(
          getWeb3Provider(wallet1.privateKey)
        );
        await expect(() =>
          dataProtector1.removeProtectedDataFromRenting({
            collectionTokenId: collectionTokenId,
            protectedDataAddress: protectedDataAddressMock,
          })
        ).rejects.toThrow(
          new WorkflowError(
            'Failed to Remove Protected Data From Renting: user is not collection owner.'
          )
        );
      },
      4 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
    );
    it(
      'should fail with protected data is not in collection error',
      async () => {
        const protectedDataAddressMock = Wallet.createRandom().address;
        //create collection
        const { collectionTokenId } = await dataProtector.createCollection();
        await sleep(2000);
        //to simulate the error we won't add the protected data to the collection
        await expect(() =>
          dataProtector.removeProtectedDataFromRenting({
            collectionTokenId: collectionTokenId,
            protectedDataAddress: protectedDataAddressMock,
          })
        ).rejects.toThrow(
          new WorkflowError(
            'Failed to Remove Protected Data From Renting: Protected Data is not in collection.'
          )
        );
      },
      2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
    );
  });
});
