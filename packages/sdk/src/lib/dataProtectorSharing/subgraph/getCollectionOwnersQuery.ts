import { gql, type GraphQLClient } from 'graphql-request';
import { GetCollectionOwnersGraphQLResponse } from '../../types/graphQLTypes.js';

export async function getCollectionOwnersQuery({
  graphQLClient,
}: {
  graphQLClient: GraphQLClient;
}): Promise<GetCollectionOwnersGraphQLResponse> {
  const accounts = gql`
    query Accounts {
      accounts(where: {collections_: { id_not: null } }, first: 10) {
        id
      }
    }
  `;
  const getCollectionOwnersGraphQLResponse: GetCollectionOwnersGraphQLResponse =
    await graphQLClient.request(accounts);
  return getCollectionOwnersGraphQLResponse;
}
