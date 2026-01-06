import { ObjectNotFoundError } from 'iexec/errors';
import { handleIfProtocolError, ValidationError } from '../../utils/errors.js';
import {
  booleanSchema,
  bulkRequestSchema,
  stringSchema,
  throwIfMissing,
} from '../../utils/validators.js';
import {
  BulkRequest,
  DefaultWorkerpoolConsumer,
  InspectBulkRequestParams,
  InspectBulkRequestResponse,
  TaskStatus,
} from '../types/index.js';
import { IExecConsumer, PocoSubgraphConsumer } from '../types/internalTypes.js';
import { getProtectedDataInBulk } from './getProtectedDataInBulk.js';
import { getResultFromCompletedTask } from './getResultFromCompletedTask.js';

export type InspectBulkRequest = typeof inspectBulkRequest;

export const inspectBulkRequest = async <
  Params extends InspectBulkRequestParams
>({
  iexec = throwIfMissing(),
  pocoSubgraphClient = throwIfMissing(),
  bulkRequest,
  withResult = false,
  path,
  detailed = false,
  pemPrivateKey,
}: IExecConsumer &
  PocoSubgraphConsumer &
  DefaultWorkerpoolConsumer &
  Params): Promise<InspectBulkRequestResponse<Params>> => {
  const vRequestorder = bulkRequestSchema()
    .label('bulkRequest')
    .required()
    .validateSync(bulkRequest) as BulkRequest; // Type assertion after validation
  const vWithResult = booleanSchema()
    .label('withResult')
    .validateSync(withResult);
  const vDetailed = booleanSchema().label('detailed').validateSync(detailed);
  const vPath = stringSchema().label('path').validateSync(path);
  const vPemPrivateKey = stringSchema()
    .label('pemPrivateKey')
    .validateSync(pemPrivateKey);

  if (vPath && !vWithResult) {
    throw new ValidationError(
      'path parameter is only allowed when withResult is true'
    );
  }

  if (vWithResult) {
    const iexecResultEncryption =
      // JSON parse safe thanks to bulkRequestSchema validation
      JSON.parse(vRequestorder.params)?.iexec_result_encryption === true;
    // Validate that pemPrivateKey is provided if iexec_result_encryption is true
    if (iexecResultEncryption && !vPemPrivateKey) {
      throw new ValidationError(
        'Missing pemPrivateKey required for result decryption'
      );
    }
  }

  try {
    const tasksTotalCount = Number(vRequestorder.volume);

    const requestorderHash = await iexec.order.hashRequestorder(vRequestorder);

    const getRemainingVolume = async (): Promise<number> => {
      const contractsClient = await iexec.config.resolveContractsClient();
      const poco = contractsClient.getIExecContract();
      const consumed = (await poco.viewConsumed(requestorderHash)) as bigint;
      return tasksTotalCount - Number(consumed);
    };

    const [{ deals }, tasksToCreateCount] = await Promise.all([
      iexec.deal.fetchDealsByRequestorder(
        requestorderHash,
        { pageSize: Math.max(tasksTotalCount, 10) } // Fetch all deals (min page size 10)
      ),
      getRemainingVolume(),
    ]);

    const tasks: InspectBulkRequestResponse<Params>['tasks'] = [];

    let taskProtectedDataAddressesMap: Record<
      string,
      { protectedDataAddresses: string[] }
    > = {};

    if (vDetailed) {
      taskProtectedDataAddressesMap = await getProtectedDataInBulk({
        pocoSubgraphClient,
        bulkRequestHash: requestorderHash,
      });
    }

    for (const deal of deals) {
      const dealTasks = await Promise.all(
        new Array(deal.botSize).fill(deal.botFirst).map(async (botFirst, i) => {
          const taskId = await iexec.deal.computeTaskId(
            deal.dealid,
            botFirst + i
          );
          let error: Error | undefined;
          let success: boolean | undefined;
          const { statusName } = await iexec.task.show(taskId).catch((e) => {
            if (e instanceof ObjectNotFoundError) {
              // task is not yet initialized
              return { statusName: 'UNSET' };
            }
            throw e;
          });
          let result: InspectBulkRequestResponse<Params>['tasks'][number]['result'];

          if (statusName === 'FAILED' || statusName === 'TIMEOUT') {
            success = false;
            error = new Error(
              `Task ${taskId} has failed with status ${statusName}`
            );
          } else if (statusName === 'COMPLETED') {
            success = true;
            if (vWithResult) {
              try {
                const taskResult = await getResultFromCompletedTask({
                  iexec,
                  taskId,
                  path: vPath,
                  pemPrivateKey: vPemPrivateKey,
                });
                result =
                  taskResult.result as InspectBulkRequestResponse<Params>['tasks'][number]['result'];
              } catch (e) {
                error = e as Error;
              }
            }
          }
          const task = {
            taskId: taskId,
            dealId: deal.dealid,
            bulkIndex: botFirst + i,
            status: statusName as TaskStatus,
            success,
            ...(vDetailed &&
              statusName !== 'UNSET' && {
                protectedDataAddresses:
                  taskProtectedDataAddressesMap[taskId]?.protectedDataAddresses,
              }),
            ...(vWithResult && { result }),
            error,
          } as InspectBulkRequestResponse<Params>['tasks'][number];
          return task;
        })
      );
      tasks.push(...dealTasks);
    }
    tasks.sort((a, b) => a.bulkIndex - b.bulkIndex);

    const tasksProcessingCount = tasks.filter(
      (task) =>
        task.status === 'UNSET' ||
        task.status === 'ACTIVE' ||
        task.status === 'REVEALING'
    ).length;

    const tasksCompletedCount = tasks.filter(
      (task) =>
        task.status === 'COMPLETED' ||
        task.status === 'FAILED' ||
        task.status === 'TIMEOUT'
    ).length;

    const bulkStatus =
      tasksCompletedCount === tasksTotalCount
        ? 'FINISHED'
        : tasksToCreateCount > 0
        ? 'INITIALIZING'
        : 'IN_PROGRESS';

    return {
      bulkStatus,
      tasksProcessingCount,
      tasksToCreateCount,
      tasksCompletedCount,
      tasksTotalCount,
      tasks,
    };
  } catch (error) {
    handleIfProtocolError(error);
    throw error;
  }
};
