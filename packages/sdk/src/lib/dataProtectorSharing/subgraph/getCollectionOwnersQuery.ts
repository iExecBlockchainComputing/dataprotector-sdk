import { gql, type GraphQLClient } from 'graphql-request';
import { Address } from 'iexec';
import { GetCollectionOwnersGraphQLResponse } from '../../types/graphQLTypes.js';

export async function getCollectionOwnersQuery({
  graphQLClient,
  userAddress,
  limit,
}: {
  graphQLClient: GraphQLClient;
  userAddress: Address;
  limit: number;
}): Promise<GetCollectionOwnersGraphQLResponse> {
  /**
   * TODO When on graphnode >= v0.30
   *
   * Change
   *   orderBy: id,
   * to
   *   orderBy: collections__creationTimestamp,
   *   orderDirection: desc,
   *
   * See https://thegraph.com/docs/en/querying/graphql-api/#example-for-nested-entity-sorting
   *
   * And then update docs :)
   */
  const accounts = gql`
    query {
      accounts(
        where: { collections_: { id_not: null } },
        orderBy: id,
        first: ${limit}
      ) {
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
