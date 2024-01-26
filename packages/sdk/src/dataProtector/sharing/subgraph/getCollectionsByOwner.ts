import { gql, type GraphQLClient } from 'graphql-request';
import type { Address } from '../../types.js';

export async function getCollectionsByOwner({
  graphQLClient,
  ownerAddress,
}: {
  graphQLClient: GraphQLClient;
  ownerAddress: Address;
}) {
  // Get all creator's collections
  const creatorCollectionQuery = gql`
    query  {
      collections(
        where: {
          owner: "${ownerAddress}",
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
