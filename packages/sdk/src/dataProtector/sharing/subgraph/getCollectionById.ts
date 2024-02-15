import { gql, type GraphQLClient } from 'graphql-request';
import type { Address } from '../../types/index.js';

export async function getCollectionById({
  graphQLClient,
  collectionTokenId,
}: {
  graphQLClient: GraphQLClient;
  collectionTokenId: number;
}) {
  const getProtectedDataQuery = gql`
    query {
      collection(id: "${collectionTokenId}") {
        id
        owner{
          id
        }
        protectedDatas {
          id
        }
      }
    }
  `;
  const { collection } = await graphQLClient.request<{
    collection: {
      id: Address;
      protectedDatas: { id: Address }[];
      owner: { id: Address };
    };
  }>(getProtectedDataQuery);
  return collection;
}
