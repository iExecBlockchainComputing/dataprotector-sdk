import { gql, type GraphQLClient } from 'graphql-request';
import { GetCollectionOwnersGraphQLResponse } from '../../types/graphQLTypes.js';

export async function getCollectionOwnersQuery({
  graphQLClient,
}: {
  graphQLClient: GraphQLClient;
}): Promise<GetCollectionOwnersGraphQLResponse> {
  const getCreatorsQuery = gql`
    query Creators {
      accounts(first: 10) {
        id
      }
    }
  `;
  const getCollectionOwnersGraphQLResponse: GetCollectionOwnersGraphQLResponse =
    await graphQLClient.request(getCreatorsQuery);
  return getCollectionOwnersGraphQLResponse;
}
