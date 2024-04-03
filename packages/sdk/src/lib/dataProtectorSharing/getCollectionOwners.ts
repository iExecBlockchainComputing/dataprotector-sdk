import { WorkflowError } from '../../utils/errors.js';
import { throwIfMissing } from '../../utils/validators.js';
import type { GetCollectionOwnersResponse } from '../types/index.js';
import type { SubgraphConsumer } from '../types/internalTypes.js';
import { getCollectionOwnersQuery } from './subgraph/getCollectionOwnersQuery.js';

export async function getCollectionOwners({
  graphQLClient = throwIfMissing(),
}: SubgraphConsumer): Promise<GetCollectionOwnersResponse> {
  try {
    const getCollectionOwnersQueryResponse = await getCollectionOwnersQuery({
      graphQLClient,
    });

    return { collectionOwners: getCollectionOwnersQueryResponse.accounts };
  } catch (e) {
    console.error(e);
    throw new WorkflowError('Failed to get collection owners', e);
  }
}
