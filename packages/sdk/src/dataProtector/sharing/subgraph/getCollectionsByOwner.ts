import { gql, type GraphQLClient } from 'graphql-request';
import { Address } from '../../types/shared.js';

export type OneCollectionByOwnerResponse = {
  id: number;
  creationTimestamp: number;
  protectedDatas: Array<{
    id: Address;
    name: string;
    creationTimestamp: number;
    isRentable: boolean;
    isIncludedInSubscription: boolean;
  }>;
  subscriptionParams: {
    price: number;
    duration: number;
  };
  subscriptions: Array<{
    subscriber: {
      id: Address;
    };
    endDate: number;
  }>;
};

export type GetCollectionsByOwnerResponse = Array<OneCollectionByOwnerResponse>;

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
        orderDirection: asc
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
  return creatorCollections.map((collection) => ({
    id: Number(collection.id),
    ...collection,
  }));
}
