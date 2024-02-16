import { beforeAll, describe, expect, it } from '@jest/globals';
import { Wallet, type HDNodeWallet } from 'ethers';
import { IExecDataProtector, getWeb3Provider } from '../../../src/index.js';
import {
  MAX_EXPECTED_BLOCKTIME,
  MAX_EXPECTED_WEB2_SERVICES_TIME,
  waitForSubgraphIndexing,
} from '../../test-utils.js';

describe('dataProtector.setProtectedDataToSubscription()', () => {
  let dataProtector: IExecDataProtector;
  let wallet: HDNodeWallet;

  beforeAll(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtector(getWeb3Provider(wallet.privateKey));
  });

  describe('When calling setProtectedDataToSubscription()', () => {
    it(
      'should answer with success true',
      async () => {
        //Create a Protected data
        const result = await dataProtector.protectData({
          name: 'test',
          data: { doNotUse: 'test' },
        });
        const { collectionTokenId } = await dataProtector.createCollection();

        waitForSubgraphIndexing();
        await dataProtector.addToCollection({
          collectionTokenId,
          protectedDataAddress: result.address,
        });
        // call the setProtectedDataToSubscription method
        await waitForSubgraphIndexing();
        const { success } = await dataProtector.setProtectedDataToSubscription({
          protectedDataAddress: result.address,
        });
        expect(success).toBe(true);
      },
      10 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
    );
  });
});
