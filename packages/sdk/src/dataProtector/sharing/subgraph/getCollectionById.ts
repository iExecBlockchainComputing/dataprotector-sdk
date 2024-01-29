import { gql, type GraphQLClient } from 'graphql-request';
import { Address } from '../../types.js';

export async function getCollectionById({
  graphQLClient,
  collectionId,
}: {
  graphQLClient: GraphQLClient;
  collectionId: number;
}) {
  const collectionQuery = gql`
    query  {
      collection(id: "${collectionId}") {
        id
        owner {
          id
        }
      }
    }
  `;
  const { collection } = await graphQLClient.request<{
    collection: { id: bigint; owner: { id: Address } } | undefined;
  }>(collectionQuery);
  return collection;
}
