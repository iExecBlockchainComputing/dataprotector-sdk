import { gql } from 'graphql-request';
import { GetProtectedDataRentersGraphQLResponse } from '../../types/graphQLTypes.js';
import { SubgraphConsumer } from '../../types/internalTypes.js';
import { GetRentersParams } from '../../types/sharingTypes.js';

export const getProtectedDataRenters = async ({
  graphQLClient,
  protectedDataAddress,
  includePastRentals = false,
}: GetRentersParams &
  SubgraphConsumer): Promise<GetProtectedDataRentersGraphQLResponse> => {
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
  const getRentersQueryResponse: GetProtectedDataRentersGraphQLResponse =
    await graphQLClient.request(query);
  return getRentersQueryResponse;
};
