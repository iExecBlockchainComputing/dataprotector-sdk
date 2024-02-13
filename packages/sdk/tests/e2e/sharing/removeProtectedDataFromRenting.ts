import { beforeAll, describe, expect, it, jest } from '@jest/globals';
import { Wallet, type HDNodeWallet } from 'ethers';
import { IExecDataProtector, getWeb3Provider } from '../../../src/index.js';
import {
  MAX_EXPECTED_BLOCKTIME,
  MAX_EXPECTED_WEB2_SERVICES_TIME,
  sleep,
} from '../../test-utils.js';

describe('dataProtector.removeProtectedDataFromRenting()', () => {
  let dataProtector: IExecDataProtector;
  let wallet: HDNodeWallet;

  beforeAll(async () => {
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
  });
});
