import { gql, type GraphQLClient } from 'graphql-request';
import type { Address } from '../../types.js';

export async function getCreatorCollections({
  graphQLClient,
  creatorAddress,
}: {
  graphQLClient: GraphQLClient;
  creatorAddress: Address;
}) {
  // Get all creator's collections
  const creatorCollectionQuery = gql`
    query  {
      collections(
        where: {
          owner: "${creatorAddress}",
        }
      ) {
        id
      }
    }
  `;
  const { collections: creatorCollections } = await graphQLClient.request<{
    collections: Array<{ id: bigint }>;
  }>(creatorCollectionQuery);
  return creatorCollections;
}
