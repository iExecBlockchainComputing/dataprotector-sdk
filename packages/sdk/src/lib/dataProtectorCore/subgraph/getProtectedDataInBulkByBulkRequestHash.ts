import { gql } from 'graphql-request';
import { throwIfMissing } from '../../../utils/validators.js';
import { Address } from '../../types/commonTypes.js';
import { PocoSubgraphConsumer } from '../../types/internalTypes.js';

export async function getProtectedDataInBulkByBulkRequestHash({
  pocoSubgraphClient = throwIfMissing(),
  bulkRequestHash = throwIfMissing(),
}: PocoSubgraphConsumer & {
  bulkRequestHash: string;
}) {
  const dealsQuery = gql`
    query ($where: Deal_filter) {
      deals(where: $where) {
        dealId: id
        tasks {
          taskId: id
          bulkSlice {
            datasets {
              id
            }
          }
        }
      }
    }
  `;
  const variables = {
    where: {
      requestorder: bulkRequestHash,
    },
  };
  const res = await pocoSubgraphClient.request<{
    deals: Array<{
      dealId: string;
      tasks: Array<{
        taskId: string;
        bulkSlice?: {
          datasets: Array<{
            id: Address;
          }>;
        };
      }>;
    }>;
  }>(dealsQuery, variables);

  return res;
}
