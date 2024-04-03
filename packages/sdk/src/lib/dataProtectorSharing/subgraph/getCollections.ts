import { gql, type GraphQLClient } from 'graphql-request';
import { Address } from 'iexec';

export async function getCollections({
  graphQLClient,
  includeEmptyCollections = true,
}: {
  graphQLClient: GraphQLClient;
  includeEmptyCollections?: boolean;
}) {
  const collectionsQuery = gql`
    query {
      collections(
        where: {
          ${
            !includeEmptyCollections ? `protectedDatas_: { id_not: null },` : ''
          },
        }, first: 10) {
        id
        owner {
          id
        }
        subscriptionParams {
          price
          duration
        }
      }
    }
  `;
  // }
  const collections = await graphQLClient.request<{
    collections: Array<{
      id: bigint;
      owner: { id: Address };
      subscriptionParams: { price: number; duration: number };
    }>;
  }>(collectionsQuery);
  console.log('[SDK] collections', collections);
  return {
    collections: collections.collections.map((collection) => ({
      collectionTokenId: Number(collection.id),
      ...collection,
    })),
  };
}
