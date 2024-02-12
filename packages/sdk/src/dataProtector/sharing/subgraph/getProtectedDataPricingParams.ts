import { gql, type GraphQLClient } from 'graphql-request';
import type { Address } from '../../types.js';

export async function getProtectedDataPricingParams({
  graphQLClient,
  protectedDataAddress,
}: {
  graphQLClient: GraphQLClient;
  protectedDataAddress: Address;
}) {
  const getProtectedDataQuery = gql`
    query  {
      protectedData(
        id: "${protectedDataAddress}"
      ) {
        id
        name
        isFree
        isRentable
        isIncludedInSubscription
        isForSale
      }
    }
  `;
  const { protectedData } = await graphQLClient.request<{
    protectedData: {
      id: Address;
      name: string;
      isFree: boolean;
      isRentable: boolean;
      isIncludedInSubscription: boolean;
      isForSale: boolean;
    };
  }>(getProtectedDataQuery);
  return protectedData;
}
