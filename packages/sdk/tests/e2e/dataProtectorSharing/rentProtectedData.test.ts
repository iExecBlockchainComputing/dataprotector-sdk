import { beforeAll, describe, expect, it } from '@jest/globals';
import { Wallet, type HDNodeWallet } from 'ethers';
import { IExecDataProtector, getWeb3Provider } from '../../../src/index.js';
import {
  MAX_EXPECTED_BLOCKTIME,
  MAX_EXPECTED_WEB2_SERVICES_TIME,
  waitForSubgraphIndexing,
} from '../../test-utils.js';

describe('dataProtector.rentProtectedData()', () => {
  let dataProtector: IExecDataProtector;
  let wallet: HDNodeWallet;

  beforeAll(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtector(getWeb3Provider(wallet.privateKey));
  });

  describe('When calling rentProtectedData()', () => {
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

        //add Protected Data To Collection
        await dataProtector.dataProtectorSharing.addToCollection({
          protectedDataAddress: result.address,
          collectionTokenId,
        });

        waitForSubgraphIndexing();
        //Test price and duration values
        const price = BigInt('0');
        const duration = 2000;

        await dataProtector.dataProtectorSharing.setProtectedDataToRenting({
          protectedDataAddress: result.address,
          durationInSeconds: duration,
          priceInNRLC: price,
        });

        waitForSubgraphIndexing();
        const { success } =
          await dataProtector.dataProtectorSharing.rentProtectedData({
            protectedDataAddress: result.address,
          });
        expect(success).toBe(true);
      },
      10 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
    );
  });
});
