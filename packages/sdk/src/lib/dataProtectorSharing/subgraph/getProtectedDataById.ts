import { gql, type GraphQLClient } from 'graphql-request';
import type { Address } from '../../types/index.js';

export async function getProtectedDataById({
  graphQLClient,
  protectedDataAddress,
}: {
  graphQLClient: GraphQLClient;
  protectedDataAddress: Address;
}) {
  const today = Math.floor(new Date().getTime() / 1000);

  const getProtectedDataQuery = gql`
    query  {
      protectedData(
        id: "${protectedDataAddress}"
      ) {
        id
        name
        owner {
          id
        }
        collection {
          id
          owner {
            id
          }
          subscriptions(orderBy: endDate, orderDirection: desc, where: { endDate_gte: "${today}" }){
            endDate
            subscriber {
              id
            }
          }
          subscriptionParams {
            duration
          }
        }
        isRentable
        isIncludedInSubscription
        isForSale
        rentals(where: { endDate_gte: "${today}" }) {
          id
          renter
        }
      }
      rentalParam(id: "${protectedDataAddress}") {
        price
        duration
      }
      saleParam(id: "${protectedDataAddress}") {
        price
      }
    }
  `;
  const { protectedData, rentalParam, saleParam } =
    await graphQLClient.request<{
      protectedData: {
        id: Address;
        name: string;
        owner: { id: Address };
        collection: {
          id: string;
          owner: { id: Address };
          subscriptions: Array<{
            endDate: number;
            subscriber: { id: Address };
          }>;
          subscriptionParams: { duration: number };
        };
        isRentable: boolean;
        isIncludedInSubscription: boolean;
        isForSale: boolean;
        rentals: Array<{ id: string; renter: Address }>;
      };
      rentalParam: {
        price: number;
        duration: number;
      };
      saleParam: {
        price: number;
      };
    }>(getProtectedDataQuery);
  return { protectedData, rentalParam, saleParam };
}
