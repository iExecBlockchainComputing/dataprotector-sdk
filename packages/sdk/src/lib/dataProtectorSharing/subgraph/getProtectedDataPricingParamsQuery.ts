import { gql } from 'graphql-request';
import { ProtectedDataPricingParamsGraphQLResponse } from '../../types/graphQLTypes.js';
import { Address } from '../../types/index.js';
import { SubgraphConsumer } from '../../types/internalTypes.js';

export async function getProtectedDataPricingParamsQuery({
  graphQLClient,
  protectedDataAddress,
}: SubgraphConsumer & {
  protectedDataAddress: Address;
}): Promise<ProtectedDataPricingParamsGraphQLResponse> {
  const getProtectedDataQuery = gql`
    query ProtectedDataInfo{
      protectedData(id: "${protectedDataAddress}") {
        id
        name
        isRentable
        isIncludedInSubscription
        isForSale
        collection {
          subscriptionParams {
            price
            duration
          }
        }
        rentalParams {
          price
          duration
        }
      }
    }
  `;
  const protectedDataPricingParamsResultQuery: ProtectedDataPricingParamsGraphQLResponse =
    await graphQLClient.request(getProtectedDataQuery);
  return protectedDataPricingParamsResultQuery;
}
