import { WorkflowError } from '../../utils/errors.js';
import { throwIfMissing } from '../../utils/validators.js';
import { GetCollectionOwnersGraphQLResponse } from '../types/graphQLTypes.js';
import type {
  CollectionOwner,
  GetCollectionOwnersResponse,
} from '../types/index.js';
import { SubgraphConsumer } from '../types/internalTypes.js';
import { getCollectionOwnersQuery } from './subgraph/getCollectionOwnersQuery.js';

export async function getCollectionOwners({
  graphQLClient = throwIfMissing(),
}: SubgraphConsumer): Promise<GetCollectionOwnersResponse> {
  try {
    const getCollectionOwnersQueryResponse: GetCollectionOwnersGraphQLResponse =
      await getCollectionOwnersQuery({
        graphQLClient,
      });

    const collectionOwners: CollectionOwner[] =
      getCollectionOwnersQueryResponse.accounts.map((owner) => ({
        address: owner.id,
      }));
    return { collectionOwners };
  } catch (e) {
    throw new WorkflowError('getCollectionOwners subgraph error', e);
  }
}
