import { gql, GraphQLClient } from 'graphql-request';
import { WorkflowError } from '../../../utils/errors.js';
import { throwIfMissing } from '../../../utils/validators.js';
import type {
  GetRentersParams,
  GraphQLRentersResponse,
  Renters,
} from '../../types.js';

export async function getRenters({
  graphQLClient,
  protectedDataAddress = throwIfMissing(),
  includePastRentals = false,
}: {
  graphQLClient: GraphQLClient;
} & GetRentersParams): Promise<Renters[]> {
  try {
    const filterValue = includePastRentals
      ? 0
      : Math.floor(new Date().getTime() / 1000);

    const query = gql`
      query MyQuery {
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

    const {
      protectedData: { rentals },
    }: GraphQLRentersResponse = await graphQLClient.request(query);

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
  } catch (e) {
    throw new WorkflowError('getRenters subgraph error', e);
  }
}
