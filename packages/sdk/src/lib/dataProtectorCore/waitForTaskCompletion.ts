import { WorkflowError } from '../../utils/errors.js';
import {
  taskIdSchema,
  throwIfMissing,
  validateOnStatusUpdateCallback,
} from '../../utils/validators.js';
import {
  OnStatusUpdateFn,
  WaitForTaskCompletionParams,
  WaitForTaskCompletionResponse,
  WaitForTaskCompletionStatuses,
} from '../types/index.js';
import { IExecConsumer } from '../types/internalTypes.js';

export const waitForTaskCompletion = async ({
  iexec = throwIfMissing(),
  dealid,
  taskId,
  onStatusUpdate = () => {},
}: IExecConsumer &
  WaitForTaskCompletionParams): Promise<WaitForTaskCompletionResponse> => {
  const vTaskId = taskIdSchema()
    .required()
    .label('taskId')
    .validateSync(taskId);
  const vDealId = taskIdSchema()
    .required()
    .label('dealId')
    .validateSync(dealid);
  const vOnStatusUpdate =
    validateOnStatusUpdateCallback<
      OnStatusUpdateFn<WaitForTaskCompletionStatuses>
    >(onStatusUpdate);

  try {
    const taskObservable = await iexec.task.obsTask(vTaskId, {
      dealid: vDealId,
    });
    let status: 'COMPLETED' | 'FAILED' | 'TIMEOUT';
    let success: boolean;
    await new Promise((resolve, reject) => {
      taskObservable.subscribe({
        next: (data) => {
          const isDone =
            data?.task?.statusName === 'COMPLETED' ||
            data?.task?.statusName === 'FAILED' ||
            data?.task?.statusName === 'TIMEOUT';
          if (isDone) {
            status = data?.task?.statusName as
              | 'COMPLETED'
              | 'FAILED'
              | 'TIMEOUT';
            success = data?.task?.statusName === 'COMPLETED';
          }
          vOnStatusUpdate({
            title: 'TASK_UPDATED',
            isDone,
            payload: {
              taskId: vTaskId,
              status: data?.task?.statusName,
            },
          });
        },
        error: (e) => {
          reject(e);
        },
        complete: () => resolve(undefined),
      });
    });
    return { status, success };
  } catch (error) {
    console.error('Error in waitForTaskCompletion:', error);
    throw new WorkflowError({
      message: 'Failed to wait for task completion',
      errorCause: error,
    });
  }
};
