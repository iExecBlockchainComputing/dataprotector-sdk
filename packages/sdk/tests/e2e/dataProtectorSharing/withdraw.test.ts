import { beforeAll, describe, expect, it } from '@jest/globals';
import { Wallet, type HDNodeWallet } from 'ethers';
import { IExecDataProtector, getWeb3Provider } from '../../../src/index.js';
import { SMART_CONTRACT_CALL_TIMEOUT } from '../../test-utils.js';

describe('dataProtector.withdraw()', () => {
  let dataProtector: IExecDataProtector;
  let wallet: HDNodeWallet;

  beforeAll(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtector(getWeb3Provider(wallet.privateKey));
  });

  describe('When calling withdraw()', () => {
    it(
      'should work',
      async () => {
        const { success, txHash } =
          await dataProtector.dataProtectorSharing.withdraw();
        expect(success).toBe(true);
        expect(txHash).toBeDefined();
      },
      SMART_CONTRACT_CALL_TIMEOUT
    );
  });
});
