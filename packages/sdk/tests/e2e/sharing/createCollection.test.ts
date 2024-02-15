import { beforeAll, describe, expect, it } from '@jest/globals';
import { Wallet, type HDNodeWallet } from 'ethers';
import { getWeb3Provider, IExecDataProtector } from '../../../src/index.js';
import { MAX_EXPECTED_BLOCKTIME } from '../../test-utils.js';

describe('dataProtector.createCollection()', () => {
  let dataProtector: IExecDataProtector;
  let wallet: HDNodeWallet;

  beforeAll(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtector(getWeb3Provider(wallet.privateKey));
  });

  describe('When calling createCollection()', () => {
    it(
      'should answer with a collection address',
      async () => {
        const createCollectionResult = await dataProtector.createCollection();
        expect(createCollectionResult).toEqual({
          collectionTokenId: expect.any(Number),
          txHash: expect.any(String),
        });
      },
      2 * MAX_EXPECTED_BLOCKTIME
    );
  });
});
