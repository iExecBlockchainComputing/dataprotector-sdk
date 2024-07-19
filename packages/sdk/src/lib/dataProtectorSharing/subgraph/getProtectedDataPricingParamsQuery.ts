import { gql } from 'graphql-request';
import { ProtectedDataPricingParamsGraphQLResponse } from '../../types/graphQLTypes.js';
import { Address } from '../../types/index.js';
import { SubgraphConsumer } from '../../types/internalTypes.js';

export async function getProtectedDataPricingParamsQuery({
  graphQLClient,
  protectedData,
}: SubgraphConsumer & {
  protectedData: Address;
}): Promise<ProtectedDataPricingParamsGraphQLResponse> {
  const protectedDataQuery = gql`
    query {
      protectedData(id: "${protectedData}") {
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

  return graphQLClient.request<ProtectedDataPricingParamsGraphQLResponse>(
    protectedDataQuery
  );
}
