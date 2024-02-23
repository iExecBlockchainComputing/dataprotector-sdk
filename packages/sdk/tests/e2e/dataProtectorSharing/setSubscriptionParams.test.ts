import { beforeAll, describe, expect, it } from '@jest/globals';
import { Wallet, type HDNodeWallet } from 'ethers';
import { IExecDataProtector, getWeb3Provider } from '../../../src/index.js';
import { MAX_EXPECTED_BLOCKTIME } from '../../test-utils.js';

describe('dataProtector.setSubscriptionParams()', () => {
  let dataProtector: IExecDataProtector;
  let wallet: HDNodeWallet;

  beforeAll(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtector(getWeb3Provider(wallet.privateKey));
  });

  describe('When calling setSubscriptionParams()', () => {
    it(
      'should answer with success true',
      async () => {
        const { collectionTokenId } =
          await dataProtector.dataProtectorSharing.createCollection();

        const { success } =
          await dataProtector.dataProtectorSharing.setSubscriptionParams({
            collectionTokenId,
            priceInNRLC: 100,
            durationInSeconds: 2000,
          });
        expect(success).toBe(true);
      },
      4 * MAX_EXPECTED_BLOCKTIME
    );
  });
});
