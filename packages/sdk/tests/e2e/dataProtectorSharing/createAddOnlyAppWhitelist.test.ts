import { HDNodeWallet, isAddress, Wallet } from 'ethers';
import { IExecDataProtector } from '../../../src/index.js';
import { getTestConfig, timeouts } from '../../test-utils.js';

describe('dataProtector.createAddOnlyAppWhitelist()', () => {
  let dataProtector: IExecDataProtector;
  let wallet: HDNodeWallet;

  beforeAll(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtector(...getTestConfig(wallet.privateKey));
  });

  describe('When calling createAddOnlyAppWhitelist()', () => {
    it(
      'should answer with an appWhitelist address',
      async () => {
        const createAppWhitelistResult =
          await dataProtector.sharing.createAddOnlyAppWhitelist();

        expect(
          isAddress(createAppWhitelistResult.addOnlyAppWhitelist)
        ).toBeTruthy();
        expect(createAppWhitelistResult.txHash).toEqual(expect.any(String));
      },
      timeouts.createAddOnlyAppWhitelist
    );
  });
});
