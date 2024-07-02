import { WorkflowError } from '../../utils/errors.js';
import {
  addressSchema,
  booleanSchema,
  throwIfMissing,
} from '../../utils/validators.js';
import type { GetRentalsParams, GetRentalsResponse } from '../types/index.js';
import { SubgraphConsumer } from '../types/internalTypes.js';
import { getRentalsQuery } from './subgraph/getRentalsQuery.js';

export async function getRentals({
  graphQLClient = throwIfMissing(),
  renterAddress,
  protectedData,
  includePastRentals = false,
}: SubgraphConsumer & GetRentalsParams): Promise<GetRentalsResponse> {
  const vRenterAddress = addressSchema()
    .label('renterAddress')
    .validateSync(renterAddress);

  // could accept ENS but should take iExec in args
  const vProtectedData = addressSchema()
    .label('protectedData')
    .validateSync(protectedData);

  const vIncludePastRentals = booleanSchema()
    .label('includePastRentals')
    .validateSync(includePastRentals);

  try {
    return await getRentalsQuery({
      graphQLClient,
      renterAddress: vRenterAddress,
      protectedData: vProtectedData,
      includePastRentals: vIncludePastRentals,
    });
  } catch (e) {
    throw new WorkflowError({
      message: 'Failed to get rentals',
      errorCause: e,
    });
  }
}
