import { beforeAll, describe, expect, it } from '@jest/globals';
import { type HDNodeWallet, Wallet } from 'ethers';
import { getWeb3Provider, IExecDataProtector } from '../../../src/index.js';
import { timeouts } from '../../test-utils.js';

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
        const result = await dataProtector.core.protectData({
          name: 'test',
          data: { doNotUse: 'test' },
        });

        const { collectionTokenId } =
          await dataProtector.sharing.createCollection();

        await dataProtector.sharing.addToCollection({
          collectionTokenId,
          protectedDataAddress: result.address,
        });

        const setProtectedDataToSubscriptionResult =
          await dataProtector.sharing.setProtectedDataToSubscription({
            protectedDataAddress: result.address,
          });
        expect(setProtectedDataToSubscriptionResult).toEqual({
          txHash: expect.any(String),
        });
      },
      timeouts.protectData +
        timeouts.createCollection +
        timeouts.addToCollection +
        timeouts.setProtectedDataToSubscription
    );
  });
});
