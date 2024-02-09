import { gql, type GraphQLClient } from 'graphql-request';
import { throwIfMissing } from '../../../utils/validators.js';
import type { GetRentersParams, Renters } from '../../types.js';

export async function getRenters({
  graphQLClient,
  protectedDataAddress = throwIfMissing(),
}: {
  graphQLClient: GraphQLClient;
} & GetRentersParams): Promise<Renters[]> {
  try {
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
    const {
      protectedData: { rentals },
    } = await graphQLClient.request<{ protectedData: { rentals: Renters[] } }>(
      getRentersForProtectedDataQuery
    );
    return rentals;
  } catch (error) {
    console.error('Error fetching renters:', error);
    return []; // Return empty array or handle error as per your application's requirement
  }
}
