import { beforeAll, describe, expect, it } from '@jest/globals';
import { Wallet, type HDNodeWallet } from 'ethers';
import { IExecDataProtector } from '../../../src/index.js';
import { getTestConfig, timeouts } from '../../test-utils.js';

describe('dataProtector.createCollection()', () => {
  let dataProtector: IExecDataProtector;
  let wallet: HDNodeWallet;

  beforeAll(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtector(...getTestConfig(wallet.privateKey));
  });

  describe('When calling createCollection()', () => {
    it(
      'should answer with a collection address',
      async () => {
        const createCollectionResult =
          await dataProtector.sharing.createCollection();
        expect(createCollectionResult).toEqual({
          collectionTokenId: expect.any(Number),
          txHash: expect.any(String),
        });
      },
      timeouts.createCollection
    );
  });
});
