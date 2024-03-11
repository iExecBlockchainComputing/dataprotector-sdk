import { GraphQLClient } from 'graphql-request';
import { WorkflowError } from '../../utils/errors.js';
import {
  addressOrEnsOrAnySchema,
  throwIfMissing,
} from '../../utils/validators.js';
import { GetProtectedDataRentersGraphQLResponse } from '../types/graphQLTypes.js';
import type {
  GetRentersParams,
  GetRentersResponse,
  Renters,
} from '../types/index.js';
import { getProtectedDataRenters } from './subgraph/getProtectedDataRenters.js';

export async function getRenters({
  graphQLClient,
  protectedDataAddress = throwIfMissing(),
  includePastRentals = false,
}: {
  graphQLClient: GraphQLClient;
} & GetRentersParams): Promise<GetRentersResponse> {
  try {
    const vProtectedDataAddress = addressOrEnsOrAnySchema()
      .required()
      .label('protectedDataAddress')
      .validateSync(protectedDataAddress);

    const getRentersQueryResponse: GetProtectedDataRentersGraphQLResponse =
      await getProtectedDataRenters({
        graphQLClient,
        protectedDataAddress: vProtectedDataAddress,
        includePastRentals,
      });

    // Map response fields to match Renters type
    const renters: Renters[] =
      getRentersQueryResponse.protectedData.rentals.map((rental) => ({
        id: rental.id,
        renter: rental.renter,
        endDateTimestamp: rental.endDate,
        creationTimestamp: rental.creationTimestamp,
        rentalParams: {
          durationInSeconds: rental.rentalParams.duration,
          priceInNRLC: rental.rentalParams.price,
        },
      }));

    return { renters };
  } catch (e) {
    throw new WorkflowError('getRenters subgraph error', e);
  }
}
