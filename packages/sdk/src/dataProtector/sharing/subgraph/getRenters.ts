import { gql, type GraphQLClient } from 'graphql-request';
import { throwIfMissing } from '../../../utils/validators.js';
import type {
  GetRentersParams,
  GraphQLRentersResponse,
  Renters,
} from '../../types.js';

export async function getRenters({
  graphQLClient,
  protectedDataAddress = throwIfMissing(),
}: {
  graphQLClient: GraphQLClient;
} & GetRentersParams): Promise<Renters[]> {
  try {
    const getRentersForProtectedDataQuery = gql`
    query MyQuery {
      protectedData(id: "${protectedDataAddress}") {
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
    // Send GraphQL request and type the response
    const {
      protectedData: { rentals },
    }: GraphQLRentersResponse = await graphQLClient.request(
      getRentersForProtectedDataQuery
    );

    // Map response fields to match Renters type
    const renters: Renters[] = rentals.map((rental) => ({
      id: rental.id,
      renter: rental.renter,
      endDateTimestamp: rental.endDate,
      creationTimestamp: rental.creationTimestamp,
      rentalParams: {
        durationInSeconds: rental.rentalParams.duration,
        priceInNRLC: rental.rentalParams.price,
      },
    }));

    return renters;
  } catch (error) {
    console.error('Error fetching renters:', error);
    return []; // Return empty array or handle error as per your application's requirement
  }
}
