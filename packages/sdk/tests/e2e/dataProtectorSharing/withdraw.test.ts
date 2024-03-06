import { beforeAll, describe, expect, it } from '@jest/globals';
import { Wallet, type HDNodeWallet } from 'ethers';
import { IExecDataProtector } from '../../../src/index.js';
import {
  SMART_CONTRACT_CALL_TIMEOUT,
  getTestConfig,
} from '../../test-utils.js';

describe('dataProtector.withdraw()', () => {
  let dataProtector: IExecDataProtector;
  let wallet: HDNodeWallet;

  beforeAll(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtector(...getTestConfig(wallet.privateKey));
  });

  // TODO: Need wallet with funds => coming soon with local stack
  describe('When calling withdraw()', () => {
    it.skip(
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
