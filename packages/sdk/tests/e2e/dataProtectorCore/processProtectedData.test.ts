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
import { processProtectedData } from '../../../src/lib/dataProtectorCore/processProtectedData.js';

describe('dataProtectorCore.processProtectedData()', () => {
  let iexec: IExec;
  let dataProtector: IExecDataProtectorCore;
  let wallet: HDNodeWallet;
  let protectedData: ProtectedDataWithSecretProps;
  let appAddress: string;
  let workerpoolAddress: string;
  const onStatusUpdateMock = jest.fn();

  beforeAll(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtectorCore(
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
    protectedData = await dataProtector.protectData({
      data: { email: 'example@example.com' },
      name: 'test do not use',
    });
    await dataProtector.grantAccess({
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

      // to skip waiting for task status 'COMPLETED' on task observer
      iexec.task.obsTask = jest.fn<any>().mockResolvedValue({
        subscribe: ({ complete }) => {
          if (complete) {
            complete();
          }
          return () => {};
        },
      });

      // to avoid view task error - no task id found for 0x...
      iexec.task.fetchResults = jest.fn<any>().mockReturnValue(
        new Response(JSON.stringify({ data: {} }), {
          status: 200,
          statusText: 'OK',
          headers: new Headers({
            'Content-Type': 'application/json',
          }),
        })
      );

      const processedData = await processProtectedData({
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
        title: 'REQUEST_TO_PROCESS_PROTECTED_DATA',
        isDone: true,
        payload: {
          txHash: expect.any(String),
          dealId: expect.any(String),
          taskId: expect.any(String),
        },
      });

      expect(onStatusUpdateMock).toHaveBeenCalledWith({
        title: 'CONSUME_TASK',
        isDone: false,
        payload: {
          taskId: expect.any(String),
        },
      });

      expect(onStatusUpdateMock).toHaveBeenCalledWith({
        title: 'CONSUME_TASK',
        isDone: true,
        payload: {
          taskId: expect.any(String),
        },
      });

      console.log(processedData);
      expect(processedData).toEqual({
        txHash: expect.any(String),
        dealId: expect.any(String),
        taskId: expect.any(String),
        result: expect.any(ArrayBuffer),
      });
    },
    3 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  it(
    'use voucher - should throw error if no voucher available for the requester',
    async () => {
      let error;
      try {
        await processProtectedData({
          iexec,
          protectedData: protectedData.address,
          app: appAddress,
          workerpool: workerpoolAddress,
          useVoucher: true,
          secrets: {
            1: 'ProcessProtectedData test subject',
            2: 'email content for test processData',
          },
          args: '_args_test_process_data_',
          onStatusUpdate: onStatusUpdateMock,
        });
      } catch (err) {
        error = err;
      }
      expect(error).toBeDefined();
      expect(error.message).toBe('Failed to process protected data');
      expect(error.cause.message).toBe(
        `No voucher available for the requester ${wallet.address}`
      );
    },
    2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
  );
});
