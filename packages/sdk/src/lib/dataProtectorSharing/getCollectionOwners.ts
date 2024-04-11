import { WorkflowError } from '../../utils/errors.js';
import { numberBetweenSchema, throwIfMissing } from '../../utils/validators.js';
import {
  GetCollectionOwnersParams,
  GetCollectionOwnersResponse,
} from '../types/index.js';
import type { SubgraphConsumer } from '../types/internalTypes.js';
import { getCollectionOwnersQuery } from './subgraph/getCollectionOwnersQuery.js';

export async function getCollectionOwners({
  graphQLClient = throwIfMissing(),
  limit,
}: SubgraphConsumer &
  GetCollectionOwnersParams): Promise<GetCollectionOwnersResponse> {
  const vLimit = numberBetweenSchema(1, 1000)
    .default(100)
    .label('limit')
    .validateSync(limit);

  try {
    const getCollectionOwnersQueryResponse = await getCollectionOwnersQuery({
      graphQLClient,
      limit: vLimit,
    });

    return { collectionOwners: getCollectionOwnersQueryResponse.accounts };
  } catch (e) {
    console.error(e);
    throw new WorkflowError('Failed to get collection owners', e);
  }
}
