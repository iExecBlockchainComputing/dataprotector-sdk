import { beforeAll, describe, expect, it, jest } from '@jest/globals';
import { Wallet } from 'ethers';
import { IExecDataProtectorCore } from '../../../src/index.js';
import { getTestConfig } from '../../test-utils.js';

describe('dataProtectorCore.waitForTaskCompletion()', () => {
  let dataProtectorCore: IExecDataProtectorCore;

  beforeAll(async () => {
    const config = await getTestConfig(Wallet.createRandom().privateKey);
    dataProtectorCore = new IExecDataProtectorCore(...config);
  });

  it('should return when the task is completed', async () => {
    // https://explorer.iex.ec/arbitrum-sepolia-testnet/task/0x52c74460f422beb2b247cb3fd9ba6ae48b75cb5b17b3212dc2ad8a121116a2fa
    const onStatusUpdate = jest.fn();
    const COMPLETED_TASKID =
      '0x52c74460f422beb2b247cb3fd9ba6ae48b75cb5b17b3212dc2ad8a121116a2fa';
    const COMPLETED_DEALID =
      '0x2c97513bbef02a71b4cf555466f1dcc65e42720cc7d938f8eb53d93cf5ecaccd';
    const res = await dataProtectorCore.waitForTaskCompletion({
      dealId: COMPLETED_DEALID,
      taskId: COMPLETED_TASKID,
      onStatusUpdate,
    });
    expect(res).toEqual({ status: 'COMPLETED', success: true });
    expect(onStatusUpdate).toHaveBeenLastCalledWith({
      title: 'TASK_UPDATED',
      isDone: true,
      payload: {
        taskId: COMPLETED_TASKID,
        status: 'COMPLETED',
      },
    });
  });

  it('should return when the task is failed', async () => {
    // https://explorer.iex.ec/arbitrum-sepolia-testnet/task/0x929cf32f0a1298170a54edfd1ffbd0a21cb2dbe5d96dbeb935583073ac61ec8f
    const FAILED_TASKID =
      '0x929cf32f0a1298170a54edfd1ffbd0a21cb2dbe5d96dbeb935583073ac61ec8f';
    const FAILED_DEALID =
      '0xd5b0b2af7c40e0e879f27d51c4b134e115fb9eb103f253603649fae09abd25c4';
    const onStatusUpdate = jest.fn();
    const res = await dataProtectorCore.waitForTaskCompletion({
      dealId: FAILED_DEALID,
      taskId: FAILED_TASKID,
      onStatusUpdate,
    });
    expect(res).toEqual({ status: 'FAILED', success: false });
    expect(onStatusUpdate).toHaveBeenLastCalledWith({
      title: 'TASK_UPDATED',
      isDone: true,
      payload: {
        taskId: FAILED_TASKID,
        status: 'FAILED',
      },
    });
  });

  it('should return when the task is in timeout', async () => {
    // https://explorer.iex.ec/arbitrum-sepolia-testnet/task/0xeda9b137c56d31b02b17b097e464fd3982c46c3939745463e4abe73edf1ae8f8
    const TIMEOUT_TASKID =
      '0x81c2ce94e358879ef165902d22ba18bc6f79964395a4eb2892d4895a66e4ffd1';
    const TIMEOUT_DEALID =
      '0x12388731f990da5d6a63a579bbf2d822930532881c16750737cab7cd4574cdde';
    const onStatusUpdate = jest.fn();
    const res = await dataProtectorCore.waitForTaskCompletion({
      dealId: TIMEOUT_DEALID,
      taskId: TIMEOUT_TASKID,
      onStatusUpdate,
    });
    expect(res).toEqual({ status: 'TIMEOUT', success: false });
    expect(onStatusUpdate).toHaveBeenLastCalledWith({
      title: 'TASK_UPDATED',
      isDone: true,
      payload: {
        taskId: TIMEOUT_TASKID,
        status: 'TIMEOUT',
      },
    });
  });
});
