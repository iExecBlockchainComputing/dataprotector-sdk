import { sumTags } from 'iexec/utils';
import { TEE_TAG } from '../../config/config.js';
import {
  WorkflowError,
  processProtectedDataErrorMessage,
  handleIfProtocolError,
  ValidationError,
} from '../../utils/errors.js';
import { filterWorkerpoolOrders } from '../../utils/processProtectedData.models.js';
import {
  addressSchema,
  booleanSchema,
  bulkRequestSchema,
  stringSchema,
  throwIfMissing,
  validateOnStatusUpdateCallback,
} from '../../utils/validators.js';
import {
  BulkRequest,
  DefaultWorkerpoolConsumer,
  OnStatusUpdateFn,
  ProcessBulkRequestParams,
  ProcessBulkRequestResponse,
  ProcessBulkRequestResponseBase,
  ProcessBulkRequestResponseWithResult,
  ProcessBulkRequestStatuses,
} from '../types/index.js';
import { IExecConsumer } from '../types/internalTypes.js';
import { getResultFromCompletedTask } from './getResultFromCompletedTask.js';
import { waitForTaskCompletion } from './waitForTaskCompletion.js';

export type ProcessBulkRequest = typeof processBulkRequest;

// Helper function to avoid unsafe setTimeout reference in loop
const waitForRetry = (ms: number): Promise<void> => {
  return new Promise<void>((resolve) => {
    setTimeout(() => resolve(), ms);
  });
};

export const processBulkRequest = async <
  Params extends ProcessBulkRequestParams
>({
  iexec = throwIfMissing(),
  defaultWorkerpool,
  bulkRequest,
  workerpool,
  path,
  pemPrivateKey,
  waitForResult = false,
  onStatusUpdate = () => {},
}: IExecConsumer & DefaultWorkerpoolConsumer & Params): Promise<
  ProcessBulkRequestResponse<Params>
> => {
  const vRequestorder = bulkRequestSchema()
    .label('bulkRequest')
    .required()
    .validateSync(bulkRequest) as BulkRequest; // Type assertion after validation
  const vWorkerpool = addressSchema()
    .default(defaultWorkerpool) // Default workerpool if none is specified
    .label('workerpool')
    .validateSync(workerpool);
  const vWaitForResult = booleanSchema()
    .label('waitForResult')
    .validateSync(waitForResult);
  const vPath = stringSchema().label('path').validateSync(path);
  const vPemPrivateKey = stringSchema()
    .label('pemPrivateKey')
    .validateSync(pemPrivateKey);
  const vOnStatusUpdate =
    validateOnStatusUpdateCallback<
      OnStatusUpdateFn<ProcessBulkRequestStatuses>
    >(onStatusUpdate);

  const iexecResultEncryption =
    // JSON parse safe thanks to bulkRequestSchema validation
    JSON.parse(vRequestorder.params)?.iexec_result_encryption === true;
  // Validate that pemPrivateKey is provided if iexec_result_encryption is true
  if (vWaitForResult && iexecResultEncryption && !vPemPrivateKey) {
    throw new ValidationError(
      'Missing pemPrivateKey required for result decryption'
    );
  }

  if (vWaitForResult && !iexecResultEncryption && vPemPrivateKey) {
    throw new ValidationError(
      'pemPrivateKey is passed but result encryption is not enabled in bulkRequest this is likely an error when preparing the bulk request'
    );
  }

  try {
    vOnStatusUpdate({
      title: 'FETCH_ORDERS',
      isDone: false,
    });

    // Fetch app order
    const apporder = await iexec.orderbook
      .fetchAppOrderbook({
        app: vRequestorder.app,
        minTag: TEE_TAG,
        workerpool: vWorkerpool,
      })
      .then((appOrderbook) => {
        const desiredPriceAppOrderbook = appOrderbook.orders.filter(
          (order) => order.order.appprice <= Number(vRequestorder.appmaxprice)
        );
        const desiredPriceAppOrder = desiredPriceAppOrderbook[0]?.order;
        if (!desiredPriceAppOrder) {
          throw new Error('No App order found for the desired price');
        }
        return desiredPriceAppOrder;
      });

    vOnStatusUpdate({
      title: 'FETCH_ORDERS',
      isDone: true,
    });

    const volume = Number(vRequestorder.volume);
    const requestorderHash = await iexec.order.hashRequestorder(vRequestorder);

    const getRemainingVolume = async (): Promise<number> => {
      const contractsClient = await iexec.config.resolveContractsClient();
      const poco = contractsClient.getIExecContract();
      const consumed = (await poco.viewConsumed(requestorderHash)) as bigint;
      return volume - Number(consumed);
    };

    vOnStatusUpdate({
      title: 'CREATE_BULK_TASKS',
      isDone: false,
      payload: {
        remainingVolume: await getRemainingVolume(),
        totalVolume: volume,
      },
    });

    // While loop to match orders until volume is reached
    let remainingVolume: number;
    while ((remainingVolume = await getRemainingVolume()) > 0) {
      // Fetch workerpool order
      const workerpoolorder = await iexec.orderbook
        .fetchWorkerpoolOrderbook({
          workerpool: vWorkerpool,
          app: vRequestorder.app,
          dataset: vRequestorder.dataset, // For bulk requests, we don't specify a specific dataset
          requester: vRequestorder.requester,
          isRequesterStrict: false,
          minTag: sumTags([apporder.tag, vRequestorder.tag]),
          category: 0,
        })
        .then((workerpoolOrderbook) => {
          const desiredPriceWorkerpoolOrder = filterWorkerpoolOrders({
            workerpoolOrders: workerpoolOrderbook.orders,
            workerpoolMaxPrice: Number(vRequestorder.workerpoolmaxprice),
          });
          return desiredPriceWorkerpoolOrder;
        });

      // If no workerpool order is available, wait and retry
      if (!workerpoolorder) {
        vOnStatusUpdate({
          title: 'WAIT_FOR_WORKERPOOL_AVAILABILITY',
          isDone: false,
          payload: {
            remainingVolume,
            totalVolume: volume,
          },
        });

        // Wait 5 seconds before retrying
        await waitForRetry(5000);
        continue;
      }

      const orders = {
        requestorder: vRequestorder,
        workerpoolorder: workerpoolorder,
        apporder: apporder,
      };

      const {
        volume: matchableVolume,
        total,
      } = await iexec.order.estimateMatchOrders(orders);

      vOnStatusUpdate({
        title: 'REQUEST_TO_PROCESS_BULK_DATA',
        isDone: false,
        payload: {
          cost: total.toString(),
          remainingVolume,
          matchVolume: matchableVolume.toNumber(),
          totalVolume: volume,
        },
      });

      const {
        dealid,
        txHash,
        volume: matchedVolume,
      } = await iexec.order.matchOrders(orders);

      vOnStatusUpdate({
        title: 'REQUEST_TO_PROCESS_BULK_DATA',
        isDone: true,
        payload: {
          txHash: txHash,
          dealId: dealid,
          matchVolume: matchedVolume.toNumber(),
          totalVolume: volume,
        },
      });
    }

    const { deals } = await iexec.deal.fetchDealsByRequestorder(
      requestorderHash,
      { pageSize: Math.max(volume, 10) } // Fetch all deals (min page size 10)
    );

    const tasks: ProcessBulkRequestResponseBase['tasks'] = [];

    for (const deal of deals) {
      const dealTasks = await Promise.all(
        new Array(deal.botSize)
          .fill(deal.botFirst)
          .map(async (botFirst, i) => ({
            taskId: await iexec.deal.computeTaskId(deal.dealid, botFirst + i),
            dealId: deal.dealid,
            bulkIndex: botFirst + i,
          }))
      );
      tasks.push(...dealTasks);
    }
    tasks.sort((a, b) => a.bulkIndex - b.bulkIndex);

    vOnStatusUpdate({
      title: 'CREATE_BULK_TASKS',
      isDone: true,
      payload: {
        totalMatches: deals.length,
        totalVolume: volume,
        tasks,
      },
    });

    if (!vWaitForResult) {
      return {
        tasks,
      } as ProcessBulkRequestResponse<Params>;
    }

    const tasksWithResults =
      tasks as ProcessBulkRequestResponseWithResult['tasks'];

    await Promise.all(
      tasksWithResults.map(async (task) => {
        try {
          vOnStatusUpdate({
            title: 'PROCESS_BULK_SLICE',
            isDone: false,
            payload: task,
          });
          vOnStatusUpdate({
            title: 'TASK_EXECUTION',
            isDone: false,
            payload: task,
          });
          const { status, success } = await waitForTaskCompletion({
            iexec,
            taskId: task.taskId,
            dealId: task.dealId,
          });
          task.status = status;
          task.success = success;
          vOnStatusUpdate({
            title: 'TASK_EXECUTION',
            isDone: true,
            payload: task,
          });
          if (!success) {
            throw new Error(`Task ended with status: ${status}`);
          }
          const { result } = await getResultFromCompletedTask({
            iexec,
            taskId: task.taskId,
            path: vPath,
            pemPrivateKey: vPemPrivateKey,
            onStatusUpdate: (update) => {
              vOnStatusUpdate({
                ...update,
                payload: { ...update.payload, task },
              });
            },
          });
          task.result = result;
          vOnStatusUpdate({
            title: 'PROCESS_BULK_SLICE',
            isDone: true,
            payload: task,
          });
        } catch (error) {
          task.error = error as Error;
          vOnStatusUpdate({
            title: 'PROCESS_BULK_SLICE',
            isDone: true,
            payload: task,
          });
        }
      })
    );

    return {
      tasks: tasksWithResults,
    };
  } catch (error) {
    console.error('[processBulkRequest] ERROR', error);
    handleIfProtocolError(error);
    throw new WorkflowError({
      message: processProtectedDataErrorMessage,
      errorCause: error,
    });
  }
};
