import { WorkflowError } from '../../utils/errors.js';
import { addressSchema, throwIfMissing } from '../../utils/validators.js';
import { GetRentalsGraphQLResponse } from '../types/graphQLTypes.js';
import type {
  GetProtectedDataRentalsParams,
  GetProtectedDataRentalsResponse,
  ProtectedDataRental,
} from '../types/index.js';
import { SubgraphConsumer } from '../types/internalTypes.js';
import { getProtectedDataRentalsQuery } from './subgraph/getProtectedDataRentalsQuery.js';

export async function getProtectedDataRentals({
  graphQLClient = throwIfMissing(),
  protectedDataAddress = throwIfMissing(),
  includePastRentals = false,
}: SubgraphConsumer &
  GetProtectedDataRentalsParams): Promise<GetProtectedDataRentalsResponse> {
  try {
    // could accept ENS but should take iExec in args
    const vProtectedDataAddress = addressSchema()
      .required()
      .label('protectedDataAddress')
      .validateSync(protectedDataAddress);

    const getRentalsQueryResponse: GetRentalsGraphQLResponse['protectedData'] =
      await getProtectedDataRentalsQuery({
        graphQLClient,
        protectedDataAddress: vProtectedDataAddress,
        includePastRentals,
      });

    // Map response fields to match Rentals type
    const rentals: ProtectedDataRental[] = getRentalsQueryResponse.rentals.map(
      (rental) => ({
        id: rental.id,
        renter: rental.renter,
        endDateTimestamp: rental.endDate,
        creationTimestamp: rental.creationTimestamp,
        rentalParams: {
          durationInSeconds: rental.rentalParams.duration,
          priceInNRLC: rental.rentalParams.price,
        },
      })
    );

    return { rentals };
  } catch (e) {
    throw new WorkflowError(
      'Failed to get protected data rentals information',
      e
    );
  }
}
