import { gql } from 'graphql-request';
import { throwIfMissing } from '../../../utils/validators.js';
import { GetRentersGraphQLResponse } from '../../types/graphQLTypes.js';
import { SubgraphConsumer } from '../../types/internalTypes.js';
import { GetRentersParams } from '../../types/sharingTypes.js';

export const getRentersQuery = async ({
  graphQLClient = throwIfMissing(),
  protectedDataAddress,
  includePastRentals = false,
}: GetRentersParams & SubgraphConsumer): Promise<GetRentersGraphQLResponse> => {
  const filterValue = includePastRentals
    ? 0
    : Math.floor(new Date().getTime() / 1000);

  const query = gql`
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
  const getRentersQueryResponse: GetRentersGraphQLResponse =
    await graphQLClient.request(query);
  return getRentersQueryResponse;
};
