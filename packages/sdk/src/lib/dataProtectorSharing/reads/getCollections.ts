import { gql, type GraphQLClient } from 'graphql-request';

export async function getCollections({
  graphQLClient,
  includeEmptyCollections = true,
}: {
  graphQLClient: GraphQLClient;
  includeEmptyCollections?: boolean;
}) {
  let collectionsQuery;
  if (includeEmptyCollections) {
    collectionsQuery = gql`
      query {
        collections(first: 10) {
          id
          owner {
            id
          }
        }
      }
    `;
  } else {
    collectionsQuery = gql`
      query {
        collections(where: { protectedDatas_: { id_not: null } }, first: 10) {
          id
          owner {
            id
          }
        }
      }
    `;
  }
  const collections = await graphQLClient.request(collectionsQuery);
  return {
    collections: collections.collections.map((collection) => ({
      collectionTokenId: Number(collection.id),
      ownerAddress: collection.owner.id,
    })),
  };
}
