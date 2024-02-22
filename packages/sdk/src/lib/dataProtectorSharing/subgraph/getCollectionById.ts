import { gql, type GraphQLClient } from 'graphql-request';
import type { Address } from '../../types/index.js';

export async function getCollectionById({
  graphQLClient,
  collectionTokenId,
}: {
  graphQLClient: GraphQLClient;
  collectionTokenId: Address;
}) {
  const today = Math.floor(new Date().getTime() / 1000);

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
        subscriptions(orderBy: endDate, orderDirection: desc, where: { endDate_gte: "${today}" }){
          endDate
          subscriber {
            id
          }
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
      subscriptions: Array<{ endDate: number; subscriber: { id: Address } }>;
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
