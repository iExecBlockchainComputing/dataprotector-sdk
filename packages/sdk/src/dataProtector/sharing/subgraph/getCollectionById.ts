import { gql, type GraphQLClient } from 'graphql-request';
import type { Address } from '../../types/index.js';

export async function getCollectionById({
  graphQLClient,
  collectionTokenId,
}: {
  graphQLClient: GraphQLClient;
  collectionTokenId: Address;
}) {
  const getProtectedDataQuery = gql`
    query {
      collection(id: "${collectionTokenId}") {
        id
        owner {
          id
        }
        protectedDatas {
          id
        }
        subscriptionParams {
          duration
          price
        }
      }
    }
  `;
  const { collection } = await graphQLClient.request<{
    collection: {
      id: string;
      owner: { id: Address };
      protectedDatas: Array<{ id: Address }>;
      subscriptionParams: { duration: number; price: number };
    };
  }>(getProtectedDataQuery);
  if (!collection) {
    return null;
  }

  return {
    id: Number(collection.id),
    ...collection,
  };
}
