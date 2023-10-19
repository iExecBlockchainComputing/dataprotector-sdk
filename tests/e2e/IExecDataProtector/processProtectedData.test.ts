import { beforeAll, describe, it } from '@jest/globals';
import {
  IExecDataProtector,
  ProtectedDataWithSecretProps,
  getWeb3Provider,
} from '../../../dist/index';
import { Wallet } from 'ethers';
import { MAX_EXPECTED_BLOCKTIME } from '../../test-utils';

describe('dataProtector.processProtectedData()', () => {
  let dataProtector: IExecDataProtector;
  let wallet: Wallet;
  let protectedData: ProtectedDataWithSecretProps;
  beforeAll(async () => {
    wallet = Wallet.createRandom()
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
    'should successfully process a protected data ',
    async () => {
      const res = await dataProtector.processProtectedData({
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
