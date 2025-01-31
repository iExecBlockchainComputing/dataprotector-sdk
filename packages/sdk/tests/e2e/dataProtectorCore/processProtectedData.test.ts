import { beforeAll, describe, expect, it, jest } from '@jest/globals';
import { HDNodeWallet, Wallet } from 'ethers';
import { IExec } from 'iexec';
import {
  IExecDataProtectorCore,
  ProtectedDataWithSecretProps,
} from '../../../src/index.js';
import {
  MAX_EXPECTED_BLOCKTIME,
  MAX_EXPECTED_WEB2_SERVICES_TIME,
  deployRandomApp,
  getTestConfig,
} from '../../test-utils.js';

describe.skip('dataProtectorCore.processProtectedData()', () => {
  let iexec: IExec;
  let dataProtectorCore: IExecDataProtectorCore;
  let wallet: HDNodeWallet;
  let protectedData: ProtectedDataWithSecretProps;
  let appAddress: string;
  let workerpoolAddress: string;

  beforeAll(async () => {
    wallet = Wallet.createRandom();
    dataProtectorCore = new IExecDataProtectorCore(
      ...getTestConfig(wallet.privateKey)
    );
    // create app & workerpool
    const [ethProvider, options] = getTestConfig(wallet.privateKey);
    appAddress = await deployRandomApp({
      ethProvider,
      teeFramework: 'scone',
    });
    iexec = new IExec({ ethProvider }, options.iexecOptions);
    await iexec.order
      .createApporder({ app: appAddress, volume: 1000, tag: ['tee', 'scone'] })
      .then(iexec.order.signApporder)
      .then(iexec.order.publishApporder);
    const { address: workerpool } = await iexec.workerpool.deployWorkerpool({
      description: 'test pool',
      owner: await iexec.wallet.getAddress(),
    });
    workerpoolAddress = workerpool;
    await iexec.order
      .createWorkerpoolorder({
        workerpool: workerpoolAddress,
        category: 0,
        volume: 1000,
        tag: ['tee', 'scone'],
      })
      .then(iexec.order.signWorkerpoolorder)
      .then(iexec.order.publishWorkerpoolorder);

    // create protectedData
    protectedData = await dataProtectorCore.protectData({
      data: { email: 'example@example.com' },
      name: 'test do not use',
    });
    await dataProtectorCore.grantAccess({
      authorizedApp: appAddress,
      protectedData: protectedData.address,
      authorizedUser: wallet.address,
      numberOfAccess: 1000,
    });
  }, 2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME);

  it(
    'should successfully process a protected data',
    async () => {
      // --- GIVEN
      const onStatusUpdateMock = jest.fn();

      iexec.task.obsTask = jest.fn<any>().mockResolvedValue({
        subscribe: ({ complete }) => {
          if (complete) {
            complete();
          }

          return () => {};
        },
      });

      const mockArrayBuffer = new ArrayBuffer(8);
      jest.unstable_mockModule(
        '../../../src/lib/dataProtectorCore/getResultFromCompletedTask.js',
        () => {
          return {
            getResultFromCompletedTask: jest
              .fn<() => Promise<ArrayBuffer>>()
              .mockResolvedValue(mockArrayBuffer),
          };
        }
      );

      // import tested module after all mocked modules
      const { processProtectedData } = await import(
        '../../../src/lib/dataProtectorCore/processProtectedData.js'
      );

      // --- WHEN
      await processProtectedData({
        iexec,
        protectedData: protectedData.address,
        app: appAddress,
        workerpool: workerpoolAddress,
        secrets: {
          1: 'ProcessProtectedData test subject',
          2: 'email content for test processData',
        },
        args: '_args_test_process_data_',
        onStatusUpdate: onStatusUpdateMock,
      });

      // --- THEN
      expect(onStatusUpdateMock).toHaveBeenCalledWith({
        title: 'FETCH_PROTECTED_DATA_ORDERBOOK',
        isDone: true,
      });
      expect(onStatusUpdateMock).toHaveBeenCalledWith({
        title: 'FETCH_APP_ORDERBOOK',
        isDone: true,
      });
      expect(onStatusUpdateMock).toHaveBeenCalledWith({
        title: 'FETCH_WORKERPOOL_ORDERBOOK',
        isDone: true,
      });
      expect(onStatusUpdateMock).toHaveBeenCalledWith({
        title: 'PUSH_REQUESTER_SECRET',
        isDone: true,
      });
      expect(onStatusUpdateMock).toHaveBeenCalledWith({
        title: 'FETCH_PROTECTED_DATA_ORDERBOOK',
        isDone: true,
      });
      expect(onStatusUpdateMock).toHaveBeenCalledWith({
        title: 'PROCESS_PROTECTED_DATA_REQUESTED',
        isDone: true,
        payload: {
          txHash: expect.any(String),
        },
      });
    },
    2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
  );
});
