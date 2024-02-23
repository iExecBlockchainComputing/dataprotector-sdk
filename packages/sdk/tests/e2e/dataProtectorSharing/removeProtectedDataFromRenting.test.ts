import { beforeEach, describe, expect, it } from '@jest/globals';
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

        //Test price and duration values
        const price = BigInt('100');
        const duration = 2000;

        await dataProtector.dataProtectorSharing.setProtectedDataToRenting({
          protectedDataAddress: result.address,
          durationInSeconds: duration,
          priceInNRLC: price,
        });
        await waitForSubgraphIndexing();

        const { success } =
          await dataProtector.dataProtectorSharing.removeProtectedDataFromRenting(
            {
              protectedDataAddress: result.address,
            }
          );
        expect(success).toBe(true);
      },
      10 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
    );

    it(
      'should fail if the protected data does not exist',
      async () => {
        //create a random protected data address
        const protectedDataAddressMock = Wallet.createRandom().address;
        //create collection
        await dataProtector.dataProtectorSharing.createCollection();
        await sleep(2000);
        const wallet1 = Wallet.createRandom();
        const dataProtector1 = new IExecDataProtector(
          getWeb3Provider(wallet1.privateKey)
        );
        await expect(() =>
          dataProtector1.dataProtectorSharing.removeProtectedDataFromRenting({
            protectedDataAddress: protectedDataAddressMock,
          })
        ).rejects.toThrow(
          new WorkflowError(
            'This protected data does not exist in the subgraph.'
          )
        );
      },
      4 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
    );
  });
});
