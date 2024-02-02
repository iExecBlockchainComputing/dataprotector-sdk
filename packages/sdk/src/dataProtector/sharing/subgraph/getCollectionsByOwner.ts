import { gql, type GraphQLClient } from 'graphql-request';
import type { Address } from '../../types.js';

export async function getCollectionsByOwner({
  graphQLClient,
  ownerAddress,
}: {
  graphQLClient: GraphQLClient;
  ownerAddress: Address;
}) {
  const creatorCollectionQuery = gql`
    query  {
      collections(
        where: {
          owner: "${ownerAddress}",
        }
        orderBy: creationTimestamp
        orderDirection: desc
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

// Same result as:
/*
{
  account(id: "${ownerAddress}") {
    collections {
      id
    }
  }
}
*/
