import { beforeAll, describe, expect, it, jest } from '@jest/globals';
import { Wallet, type HDNodeWallet } from 'ethers';
import { IExecDataProtector, getWeb3Provider } from '../../../src/index.js';
import {
  MAX_EXPECTED_BLOCKTIME,
  MAX_EXPECTED_WEB2_SERVICES_TIME,
} from '../../test-utils.js';

describe('dataProtector.removeProtectedDataAsRentable()', () => {
  let dataProtector: IExecDataProtector;
  let wallet: HDNodeWallet;

  beforeAll(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtector(getWeb3Provider(wallet.privateKey));
  });

  describe('When calling removeProtectedDataAsRentable()', () => {
    it(
      'should answer with success true',
      async () => {
        //Create a Protected data
        const result = await dataProtector.protectData({
          name: 'test',
          data: { doNotUse: 'test' },
        });
        //create collection
        const { collectionId } = await dataProtector.createCollection();

        const onStatusUpdateMock = jest.fn();
        //add Protected Data To Collection
        await dataProtector.addToCollection({
          protectedDataAddress: result.address,
          collectionId,
          onStatusUpdate: onStatusUpdateMock,
        });
        //Test price and duration values
        const price = BigInt('100');
        const duration = 2000;

        await dataProtector.setProtectedDataAsRentable({
          protectedDataAddress: result.address,
          collectionTokenId: collectionId,
          durationInSeconds: duration,
          priceInNRLC: price,
        });
        const { success } = await dataProtector.removeProtectedDataAsRentable({
          collectionTokenId: collectionId,
          protectedDataAddress: result.address,
        });
        expect(success).toBe(true);
      },
      10 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
    );
  });
});
