import { gql } from 'graphql-request';
import { throwIfMissing } from '../../../utils/validators.js';
import { GetCollectionsByOwnerGraphQLResponse } from '../../types/graphQLTypes.js';
import type { Address } from '../../types/index.js';
import { SubgraphConsumer } from '../../types/internalTypes.js';

export async function getCollectionsByOwnerQuery({
  graphQLClient = throwIfMissing(),
  ownerAddress,
}: SubgraphConsumer & {
  ownerAddress: Address;
}): Promise<GetCollectionsByOwnerGraphQLResponse> {
  // Later, to get only still active subscriptions:
  // const now = Math.round(Date.now() / 1000);
  // subscriptions(where: {endDate_gt: "${now}"}) {
  const collections = gql`
    query CollectionsByOwner {
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
  const getCollectionsByOwnerGraphQLResponse: GetCollectionsByOwnerGraphQLResponse =
    await graphQLClient.request(collections);
  return getCollectionsByOwnerGraphQLResponse;
}
