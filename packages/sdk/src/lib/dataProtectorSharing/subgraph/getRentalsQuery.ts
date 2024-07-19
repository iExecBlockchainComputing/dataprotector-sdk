import { gql } from 'graphql-request';
import { throwIfMissing } from '../../../utils/validators.js';
import type { GetRentalsGraphQLResponse } from '../../types/graphQLTypes.js';
import type { GetRentalsParams } from '../../types/index.js';
import type { SubgraphConsumer } from '../../types/internalTypes.js';

export const getRentalsQuery = async ({
  graphQLClient = throwIfMissing(),
  renterAddress,
  protectedData,
  includePastRentals = false,
}: SubgraphConsumer & GetRentalsParams): Promise<GetRentalsGraphQLResponse> => {
  const rentalsQuery = gql`
    query ($where: Rental_filter) {
      rentals(where: $where) {
        id
        renter
        protectedData {
          id
          name
        }
        creationTimestamp
        endDate
        rentalParams {
          price
          duration
        }
      }
    }
  `;
  const variables = {
    where: {
      renter: renterAddress || undefined,
      protectedData: protectedData || undefined,
      endDate_gte: includePastRentals
        ? undefined
        : Math.floor(new Date().getTime() / 1000),
    },
  };

  return graphQLClient.request<GetRentalsGraphQLResponse>(
    rentalsQuery,
    variables
  );
};
