import { beforeAll, describe, expect, it } from '@jest/globals';
import { Wallet, type HDNodeWallet } from 'ethers';
import { IExecDataProtector } from '../../../src/index.js';
import { getTestConfig, timeouts } from '../../test-utils.js';

describe('dataProtector.setSubscriptionParams()', () => {
  let dataProtector: IExecDataProtector;
  let wallet: HDNodeWallet;

  beforeAll(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtector(...getTestConfig(wallet.privateKey));
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
      timeouts.createCollection + timeouts.setSubscriptionParams
    );
  });
});
