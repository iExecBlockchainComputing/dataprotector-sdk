import { gql, type GraphQLClient } from 'graphql-request';
import type { GetRentersParams, Renters } from '../../types.js';

export async function getRenters({
  graphQLClient,
  protectedDataAddress,
}: {
  graphQLClient: GraphQLClient;
} & GetRentersParams): Promise<Renters[]> {
  const getRentersForProtectedDataQuery = gql`
    query MyQuery {
      protectedData(id: ${protectedDataAddress}) {
        rentals {
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
  return await graphQLClient.request(getRentersForProtectedDataQuery);
}
