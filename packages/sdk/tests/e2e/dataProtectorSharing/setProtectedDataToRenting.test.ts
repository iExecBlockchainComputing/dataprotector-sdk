import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Wallet, type HDNodeWallet } from 'ethers';
import { IExecDataProtector, getWeb3Provider } from '../../../src/index.js';
import {
  sleep,
  waitForSubgraphIndexing,
} from '../../../src/lib/utils/waitForSubgraphIndexing.js';
import { WorkflowError } from '../../../src/utils/errors.js';
import {
  MAX_EXPECTED_BLOCKTIME,
  MAX_EXPECTED_WEB2_SERVICES_TIME,
} from '../../test-utils.js';

describe('dataProtector.setProtectedDataToRenting()', () => {
  let dataProtector: IExecDataProtector;
  let wallet: HDNodeWallet;

  beforeEach(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtector(getWeb3Provider(wallet.privateKey));
  });

  describe('When calling setProtectedDataToRenting()', () => {
    it(
      'should answer with success true',
      async () => {
        //Create a Protected data
        const result = await dataProtector.dataProtector.protectData({
          name: 'test',
          data: { doNotUse: 'test' },
        });
        //create collection
        const { collectionTokenId } =
          await dataProtector.dataProtectorSharing.createCollection();
        await waitForSubgraphIndexing();
        const onStatusUpdateMock = jest.fn();
        //add Protected Data To Collection
        await dataProtector.dataProtectorSharing.addToCollection({
          protectedDataAddress: result.address,
          collectionTokenId,
          onStatusUpdate: onStatusUpdateMock,
        });
        await waitForSubgraphIndexing();
        //Test price and duration values
        const price = BigInt('100');
        const duration = 2000;

        const { success } =
          await dataProtector.dataProtectorSharing.setProtectedDataToRenting({
            protectedDataAddress: result.address,
            durationInSeconds: duration,
            priceInNRLC: price,
          });
        expect(success).toBe(true);
      },
      8 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
    );

    it(
      'should fail with not collection owner error',
      async () => {
        //Create a Protected data
        const result = await dataProtector.dataProtector.protectData({
          name: 'test',
          data: { doNotUse: 'test' },
        });
        //create collection
        const { collectionTokenId } =
          await dataProtector.dataProtectorSharing.createCollection();
        await waitForSubgraphIndexing();

        //add Protected Data To Collection
        await dataProtector.dataProtectorSharing.addToCollection({
          protectedDataAddress: result.address,
          collectionTokenId,
        });
        const wallet1 = Wallet.createRandom();
        const dataProtector1 = new IExecDataProtector(
          getWeb3Provider(wallet1.privateKey)
        );

        //Test price and duration values
        const price = BigInt('100');
        const duration = 2000;

        await expect(() =>
          dataProtector1.dataProtectorSharing.setProtectedDataToRenting({
            protectedDataAddress: result.address,
            durationInSeconds: duration,
            priceInNRLC: price,
          })
        ).rejects.toThrow(
          new WorkflowError(
            'This protected data is not part of a collection owned by the user.'
          )
        );
      },
      8 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
    );

    it(
      'should fail if protected data does not exist',
      async () => {
        const protectedDataAddressMock = Wallet.createRandom().address;
        //create collection
        await dataProtector.dataProtectorSharing.createCollection();
        await sleep(2000);
        //to simulate the error we won't add the protected data to the collection
        //just wait 4 seconds until subgraph indexes the last blockchain blocks
        await new Promise((resolve) => setTimeout(resolve, 4000));
        //Test price and duration values
        const price = BigInt('100');
        const duration = 2000;

        await expect(() =>
          dataProtector.dataProtectorSharing.setProtectedDataToRenting({
            protectedDataAddress: protectedDataAddressMock,
            durationInSeconds: duration,
            priceInNRLC: price,
          })
        ).rejects.toThrow(
          new WorkflowError(
            'This protected data does not exist in the subgraph.'
          )
        );
      },
      8 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
    );
  });
});
