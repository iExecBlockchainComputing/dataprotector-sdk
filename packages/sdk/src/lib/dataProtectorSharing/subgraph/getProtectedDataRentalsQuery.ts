import { gql } from 'graphql-request';
import { throwIfMissing } from '../../../utils/validators.js';
import type { GetRentalsGraphQLResponse } from '../../types/graphQLTypes.js';
import type { SubgraphConsumer } from '../../types/internalTypes.js';
import type { GetProtectedDataRentalsParams } from '../../types/sharingTypes.js';

export const getProtectedDataRentalsQuery = async ({
  graphQLClient = throwIfMissing(),
  protectedDataAddress,
  includePastRentals = false,
}: GetProtectedDataRentalsParams & SubgraphConsumer): Promise<
  GetRentalsGraphQLResponse['protectedData']
> => {
  const filterValue = includePastRentals
    ? 0
    : Math.floor(new Date().getTime() / 1000);

  const protectedData = gql`
    query ProtectedDataRenters {
      protectedData(id: "${protectedDataAddress}") {
        rentals(where: { endDate_gte: "${filterValue}" }) {
          id
          renter
          endDate
          creationTimestamp
          rentalParams {
            duration
            price
          }
        }
      }
    }
  `;
  const getRentalsQueryResponse =
    await graphQLClient.request<GetRentalsGraphQLResponse>(protectedData);
  return getRentalsQueryResponse.protectedData;
};
