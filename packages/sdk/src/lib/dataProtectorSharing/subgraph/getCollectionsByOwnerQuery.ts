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
  const collections = gql`
    query {
      collections(
        where: {
          owner: "${ownerAddress}",
        }
        orderBy: creationTimestamp
        orderDirection: asc
      ) {
        id
        owner {
          id
        }
        creationTimestamp
        protectedDatas {
          id
          name
          creationTimestamp
          isRentable
          rentalParams {
            price
            duration
          }
          rentals {
            renter
          }
          isForSale
          saleParams {
            price
          }
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
