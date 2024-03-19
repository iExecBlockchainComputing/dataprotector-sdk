import { HDNodeWallet, isAddress, Wallet } from 'ethers';
import { Address } from 'iexec';
import { IExecDataProtector } from '../../../src/index.js';
import { getTestConfig } from '../../test-utils.js';

describe('dataProtector.addAppToAppWhitelist()', () => {
  let dataProtector: IExecDataProtector;
  let wallet: HDNodeWallet;
  let appWhitelistAddress: Address;
  let appAddress: Address;

  beforeAll(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtector(...getTestConfig(wallet.privateKey));
    const createAppWhitelistResponse =
      await dataProtector.sharing.createAppWhitelist();
    appWhitelistAddress = createAppWhitelistResponse.appWhitelist;
  });

  describe('When all prerequisites are met', () => {
    it('should correctly add app to appWhitelist', async () => {
      const addAppToAppWhitelistResult =
        await dataProtector.sharing.addAppToAppWhitelist({
          appWhitelist: appWhitelistAddress,
          app: appAddress,
        });

      expect(addAppToAppWhitelistResult).toEqual({
        txHash: expect.any(String),
      });
    });
  });
});
