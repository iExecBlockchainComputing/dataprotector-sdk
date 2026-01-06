import { WorkflowError } from '../../utils/errors.js';
import { throwIfMissing } from '../../utils/validators.js';
import { PocoSubgraphConsumer } from '../types/internalTypes.js';
import { getProtectedDataInBulkByBulkRequestHash } from './subgraph/getProtectedDataInBulkByBulkRequestHash.js';

export async function getProtectedDataInBulk({
  pocoSubgraphClient = throwIfMissing(),
  bulkRequestHash = throwIfMissing(),
}: PocoSubgraphConsumer & {
  bulkRequestHash: string;
}): Promise<Record<string, { protectedDataAddresses: string[] }>> {
  try {
    const result = await getProtectedDataInBulkByBulkRequestHash({
      pocoSubgraphClient,
      bulkRequestHash,
    });

    const tasks: Record<
      string,
      {
        protectedDataAddresses: string[];
      }
    > = {};
    result.deals.forEach((deal) => {
      deal.tasks.forEach((task) => {
        tasks[task.taskId] = {
          protectedDataAddresses: task.bulkSlice?.datasets.map(
            (dataset) => dataset.id
          ),
        };
      });
    });
    return tasks;
  } catch (e) {
    console.error('[getProtectedDataInBulk] ERROR', e);
    throw new WorkflowError({
      message: 'Failed to get protected data in bulk',
      errorCause: e,
    });
  }
}
