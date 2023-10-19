import { beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import {
  IExecDataProtector,
  ProtectedDataWithSecretProps,
  getWeb3Provider,
} from '../../../dist/index';
import { Wallet } from 'ethers';
import { MAX_EXPECTED_BLOCKTIME } from '../../test-utils';
import { WorkflowError } from '../../../dist/utils/errors';

const TEST_PRIVATE_KEY =
  '0x3d2d3e630df6f837644bfbf801fb3b0ecedc040c72736d16f56e2af85f988318';

describe('dataProtector.processProtectedData()', () => {
  let dataProtector: IExecDataProtector;
  let wallet: Wallet;
  let protectedData: ProtectedDataWithSecretProps;
  beforeAll(async () => {
    wallet = new Wallet(TEST_PRIVATE_KEY);
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
