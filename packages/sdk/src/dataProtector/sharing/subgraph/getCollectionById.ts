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
      id: Address;
      owner: { id: Address };
      protectedDatas: { id: Address }[];
      subscriptionParams: { duration: number; price: number };
      subscriptions: { endDate: number }[];
    };
  }>(getProtectedDataQuery);
  return collection;
}
