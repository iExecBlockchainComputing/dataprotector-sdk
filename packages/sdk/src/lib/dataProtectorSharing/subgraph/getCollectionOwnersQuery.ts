import { gql, type GraphQLClient } from 'graphql-request';
import { GetCollectionOwnersGraphQLResponse } from '../../types/graphQLTypes.js';

export async function getCollectionOwnersQuery({
  graphQLClient,
  limit,
}: {
  graphQLClient: GraphQLClient;
  limit: number;
}): Promise<GetCollectionOwnersGraphQLResponse> {
  const accounts = gql`
    query {
      accounts(where: { collections_: { id_not: null } }, first: ${limit}) {
        id
        collections {
          id
          creationTimestamp
          subscriptionParams {
            price
            duration
          }
        }
      }
    }
  `;
  return graphQLClient.request<GetCollectionOwnersGraphQLResponse>(accounts);
}
