import { gql, type GraphQLClient } from 'graphql-request';
import type { Address, GetCollectionsByOwnerResponse } from '../../types.js';

export async function getCollectionsByOwner({
  graphQLClient,
  ownerAddress,
}: {
  graphQLClient: GraphQLClient;
  ownerAddress: Address;
}) {
  // Later, to get only still active subscriptions:
  // const now = Math.round(Date.now() / 1000);
  // subscriptions(where: {endDate_gt: "${now}"}) {
  const creatorCollectionQuery = gql`
    query  {
      collections(
        where: {
          owner: "${ownerAddress}",
        }
        orderBy: creationTimestamp
        orderDirection: desc
      ) {
        id
        creationTimestamp
        protectedDatas {
          id
          name
          creationTimestamp
          isRentable
          isIncludedInSubscription
        }
        subscriptionParams {
          price
          duration
        }
        subscriptions {
          subscriber {
            id
          }
          endDate
        }
      }
    }
  `;
  const { collections: creatorCollections } = await graphQLClient.request<{
    collections: GetCollectionsByOwnerResponse;
  }>(creatorCollectionQuery);
  return creatorCollections;
}
