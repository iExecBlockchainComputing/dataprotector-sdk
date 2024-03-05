import { beforeAll, describe, expect, it } from '@jest/globals';
import { HDNodeWallet, Wallet } from 'ethers';
import { IExec } from 'iexec';
import {
  IExecDataProtector,
  ProtectedDataWithSecretProps,
} from '../../src/index.js';
import {
  MAX_EXPECTED_BLOCKTIME,
  MAX_EXPECTED_WEB2_SERVICES_TIME,
  getTestConfig,
  getTestIExecOption,
  getTestWeb3SignerProvider,
} from '../test-utils.js';

describe('dataProtector.processProtectedData()', () => {
  let dataProtector: IExecDataProtector;
  let wallet: HDNodeWallet;
  let protectedData: ProtectedDataWithSecretProps;
  let app: string;
  beforeAll(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtector(...getTestConfig(wallet.privateKey));
    const ethProvider = getTestWeb3SignerProvider(
      Wallet.createRandom().privateKey
    );
    const iexecOptions = getTestIExecOption();
    const resourceProvider = new IExec({ ethProvider }, iexecOptions);
    const { address: appAddress } = await resourceProvider.app.deployApp({
      owner: ethProvider.address,
      name: 'test app',
      type: 'DOCKER',
      multiaddr: 'foo',
      mrenclave: {
        framework: 'SCONE',
        entrypoint: 'node app.js',
        heapSize: 123,
        version: 'v',
        fingerprint: 'foo',
      },
      checksum:
        '0x00f51494d7a42a3c1c43464d9f09e06b2a99968e3b978f6cd11ab3410b7bcd14',
    });
    await resourceProvider.order
      .createApporder({
        app: appAddress,
        tag: ['tee', 'scone'],
      })
      .then(resourceProvider.order.signApporder)
      .then(resourceProvider.order.publishApporder);
    app = appAddress;

    const { address: workerpoolAddress } =
      await resourceProvider.workerpool.deployWorkerpool({
        owner: ethProvider.address,
        description: 'test pool',
      });
    await resourceProvider.order
      .createWorkerpoolorder({
        workerpool: workerpoolAddress,
        category: 0,
        tag: ['tee', 'scone'],
      })
      .then(resourceProvider.order.signWorkerpoolorder)
      .then(resourceProvider.order.publishWorkerpoolorder);
    app = appAddress;

    protectedData = await dataProtector.protectData({
      data: { email: 'example@example.com' },
      name: 'test do not use',
    });
    await dataProtector.grantAccess({
      authorizedApp: appAddress,
      protectedData: protectedData.address,
      authorizedUser: wallet.address,
    });
  }, 2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME);
  it(
    'should successfully process a protected data',
    async () => {
      const taskId = await dataProtector.processProtectedData({
        protectedData: protectedData.address,
        app: app,
        secrets: {
          1: 'ProcessProtectedData test subject',
          2: 'email content for test processData',
        },
        args: '_args_test_process_data_',
        workerpool: 'any',
      });
      expect(taskId).toBeDefined();
    },
    2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
  );
});
