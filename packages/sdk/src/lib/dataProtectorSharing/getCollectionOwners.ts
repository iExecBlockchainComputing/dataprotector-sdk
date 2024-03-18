import { GraphQLClient } from 'graphql-request';
import { WorkflowError } from '../../utils/errors.js';
import { GetCollectionOwnersGraphQLResponse } from '../types/graphQLTypes.js';
import type {
  CollectionOwners,
  GetCollectionOwnersResponse,
} from '../types/index.js';
import { getCollectionOwnersQuery } from './subgraph/getCollectionOwnersQuery.js';

export async function getCollectionOwners({
  graphQLClient,
}: {
  graphQLClient: GraphQLClient;
}): Promise<GetCollectionOwnersResponse> {
  try {
    const getCollectionOwnersGraphQLResponse: GetCollectionOwnersGraphQLResponse =
      await getCollectionOwnersQuery({
        graphQLClient,
      });

    const collectionOwners: CollectionOwners[] =
      getCollectionOwnersGraphQLResponse.accounts.map((creator) => ({
        address: creator.id,
      }));
    return { collectionOwners };
  } catch (e) {
    throw new WorkflowError('getRenters subgraph error', e);
  }
}
