import { beforeAll, describe, it } from '@jest/globals';
import { HDNodeWallet, Wallet } from 'ethers';
import {
  IExecDataProtector,
  ProtectedDataWithSecretProps,
  getWeb3Provider,
} from '../../../src/index.js';
import { MAX_EXPECTED_BLOCKTIME } from '../../test-utils.js';

describe('dataProtector.processProtectedData()', () => {
  let dataProtector: IExecDataProtector;
  let wallet: HDNodeWallet;
  let protectedData: ProtectedDataWithSecretProps;
  beforeAll(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtector(getWeb3Provider(wallet.privateKey));

    protectedData = await dataProtector.protectData({
      data: { email: 'example@example.com' },
      name: 'test do not use',
    });
    await dataProtector.grantAccess({
      authorizedApp: '0x4605e8af487897faaef16f0709391ef1be828591',
      protectedData: protectedData.address,
      authorizedUser: wallet.address,
    });
  }, 5 * MAX_EXPECTED_BLOCKTIME);
  it(
    'should successfully process a protected data',
    async () => {
      await dataProtector.processProtectedData({
        protectedData: protectedData.address,
        app: '0x4605e8af487897faaef16f0709391ef1be828591',
        secrets: {
          1: 'ProcessProtectedData test subject',
          2: 'email content for test processData',
        },
        args: '_args_test_process_data_',
      });
    },
    5 * MAX_EXPECTED_BLOCKTIME
  );
});
