import { HDNodeWallet, isAddress, Wallet } from 'ethers';
import { IExecDataProtector } from '../../../src/index.js';
import { getTestConfig } from '../../test-utils.js';

describe('dataProtector.createAppWhitelist()', () => {
  let dataProtector: IExecDataProtector;
  let wallet: HDNodeWallet;

  beforeAll(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtector(...getTestConfig(wallet.privateKey));
  });

  describe('When calling createAppWhitelist()', () => {
    it('should answer with an appWhitelist address', async () => {
      const createAppWhitelistResult =
        await dataProtector.sharing.createAppWhitelist();

      expect(isAddress(createAppWhitelistResult.appWhitelist)).toBeTruthy();
      expect(createAppWhitelistResult.txHash).toEqual(expect.any(String));
    });
  });
});
