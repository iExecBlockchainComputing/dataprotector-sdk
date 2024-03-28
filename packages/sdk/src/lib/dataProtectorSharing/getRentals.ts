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
  protectedDataAddress,
  includePastRentals = false,
}: SubgraphConsumer & GetRentalsParams): Promise<GetRentalsResponse> {
  const vRenterAddress = addressSchema()
    .label('renterAddress')
    .validateSync(renterAddress);

  // could accept ENS but should take iExec in args
  const vProtectedDataAddress = addressSchema()
    .label('protectedDataAddress')
    .validateSync(protectedDataAddress);

  const vIncludePastRentals = booleanSchema()
    .label('includePastRentals')
    .validateSync(includePastRentals);

  return getRentalsQuery({
    graphQLClient,
    renterAddress: vRenterAddress,
    protectedDataAddress: vProtectedDataAddress,
    includePastRentals: vIncludePastRentals,
  });
}
