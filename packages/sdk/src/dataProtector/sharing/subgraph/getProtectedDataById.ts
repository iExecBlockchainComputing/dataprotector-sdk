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
        }
        isRentable
        isIncludedInSubscription
        isForSale
        rentals(where: { endDate_gte: "${today}" }) {
          id
        }
      }
      rentalParam(id: "${protectedDataAddress}") {
        price
        duration
      }
    }
  `;
  const { protectedData, rentalParam } = await graphQLClient.request<{
    protectedData: {
      id: Address;
      name: string;
      owner: { id: Address };
      collection: { id: Address; owner: { id: Address } };
      isRentable: boolean;
      isIncludedInSubscription: boolean;
      isForSale: boolean;
      rentals: Array<{ id: string }>;
    };
    rentalParam: {
      price: number;
      duration: number;
    };
  }>(getProtectedDataQuery);
  return { protectedData, rentalParam };
}
