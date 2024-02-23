import { gql, type GraphQLClient } from 'graphql-request';
import { GetCollectionsByOwnerGraphQLResponse } from '../../types/graphQLTypes.js';
import type {
  Address,
  GetCollectionsByOwnerResponse,
} from '../../types/index.js';

export async function getCollectionsByOwner({
  graphQLClient,
  ownerAddress,
}: {
  graphQLClient: GraphQLClient;
  ownerAddress: Address;
}): Promise<GetCollectionsByOwnerResponse> {
  // Later, to get only still active subscriptions:
  // const now = Math.round(Date.now() / 1000);
  // subscriptions(where: {endDate_gt: "${now}"}) {
  const creatorCollectionQuery = gql`
    query {
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
  const {
    collections: creatorCollections,
  }: GetCollectionsByOwnerGraphQLResponse = await graphQLClient.request(
    creatorCollectionQuery
  );
  return creatorCollections.map((collection) => ({
    id: Number(collection.id),
    ...collection,
  }));
}
