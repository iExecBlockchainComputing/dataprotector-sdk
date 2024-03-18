import { gql } from 'graphql-request';
import { Address } from '../../types/index.js';
import { SubgraphConsumer } from '../../types/internalTypes.js';

export async function getProtectedDataPricingParams({
  graphQLClient,
  protectedDataAddress,
}: SubgraphConsumer & {
  protectedDataAddress: Address;
}) {
  const getProtectedDataQuery = gql`
    query ProtectedDataInfo{
      protectedData(id: "${protectedDataAddress}") {
        id
        name
        isRentable
        isIncludedInSubscription
        isForSale
      }
      rentalParam(id: "${protectedDataAddress}") {
        price
        duration
      }
    }
  `;
  const { protectedData, rentalParam } = await graphQLClient.request<{
    protectedData?: {
      id: Address;
      name: string;
      isRentable: boolean;
      isIncludedInSubscription: boolean;
      isForSale: boolean;
    };
    rentalParam?: {
      price: number;
      duration: number;
    };
  }>(getProtectedDataQuery);

  if (!protectedData) {
    return;
  }

  return {
    address: protectedData.id,
    isFree: protectedData.isRentable && rentalParam?.price === 0,
    ...protectedData,
  };
}
