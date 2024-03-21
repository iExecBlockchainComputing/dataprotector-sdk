import { gql, type GraphQLClient } from 'graphql-request';
import { Address } from 'iexec';
import { OneProtectedData } from '../../types/graphQLTypes.js';

export async function getOneProtectedData({
  graphQLClient,
  protectedDataAddress,
}: {
  graphQLClient: GraphQLClient;
  protectedDataAddress: string;
}) {
  const protectedDataQuery = gql`
    query {
      protectedData(id: "${protectedDataAddress}") {
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
    }
  `;
  const { protectedData } = await graphQLClient.request<{
    protectedData: OneProtectedData;
  }>(protectedDataQuery);
  return protectedData;
}
