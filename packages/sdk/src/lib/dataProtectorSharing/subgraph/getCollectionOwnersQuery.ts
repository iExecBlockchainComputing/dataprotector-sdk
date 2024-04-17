import { gql, type GraphQLClient } from 'graphql-request';
import { GetCollectionOwnersGraphQLResponse } from '../../types/graphQLTypes.js';
import { Address } from 'iexec';

export async function getCollectionOwnersQuery({
  graphQLClient,
  userAddress,
  limit,
}: {
  graphQLClient: GraphQLClient;
  userAddress: Address;
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
          subscriptions(where: { 
            subscriber_: { id: "${userAddress}" },
            endDate_gte: "${Math.floor(new Date().getTime() / 1000)}"
          }) {
            subscriber {
              id
            }
          }
        }
      }
    }
  `;
  return graphQLClient.request<GetCollectionOwnersGraphQLResponse>(accounts);
}
