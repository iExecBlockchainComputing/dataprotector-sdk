import { beforeAll, describe, expect, it, jest } from '@jest/globals';
import { Wallet } from 'ethers';
import { IExecDataProtectorCore } from '../../../src/index.js';
import { getTestConfig } from '../../test-utils.js';

describe('dataProtectorCore.waitForTaskCompletion()', () => {
  let dataProtectorCore: IExecDataProtectorCore;

  beforeAll(async () => {
    dataProtectorCore = new IExecDataProtectorCore(
      ...getTestConfig(Wallet.createRandom().privateKey)
    );
  });

  it('should return when the task is completed', async () => {
    // https://explorer.iex.ec/bellecour/task/0xb4655f62bdb841a3b54363b113c4204bf4fee76ab9029f33dc1218ab495970d7
    const onStatusUpdate = jest.fn();
    const COMPLETED_TASKID =
      '0xb4655f62bdb841a3b54363b113c4204bf4fee76ab9029f33dc1218ab495970d7';
    const COMPLETED_DEALID =
      '0xb5091be0385c80545cdd12e7c678b96dbb6338cf699324f8f2aa94d3f33f6eda';
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
    // https://explorer.iex.ec/bellecour/task/0x000b16d5517e44ca70744ec156e8374ae525c9ab902169fe01d909370e5778e0
    const FAILED_TASKID =
      '0x000b16d5517e44ca70744ec156e8374ae525c9ab902169fe01d909370e5778e0';
    const FAILED_DEALID =
      '0xd613b7c6c4a022efe129fd93ce547eba71fc1055e0b42d20b11ad1f3505ad0a5';
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
    // https://explorer.iex.ec/bellecour/task/0x012b3d2f21ea3c8c0cc2a40ce06df028df84d1b53b7dae98d5352e79427b93a6
    const TIMEOUT_TASKID =
      '0x012b3d2f21ea3c8c0cc2a40ce06df028df84d1b53b7dae98d5352e79427b93a6';
    const TIMEOUT_DEALID =
      '0xab15a51de7a3829fca1d3666b81b53e9e9ced0aa71bf20e7ebee1be1bdb3ee33';
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
