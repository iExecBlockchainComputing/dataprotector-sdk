import { gql } from 'graphql-request';
import { throwIfMissing } from '../../../utils/validators.js';
import {
  AddressOrENS,
  GetCollectionsByOwnerResponse,
} from '../../types/index.js';
import { SubgraphConsumer } from '../../types/internalTypes.js';

export async function getCollectionsByOwnerQuery({
  graphQLClient = throwIfMissing(),
  owner,
  includeHiddenProtectedDatas,
}: SubgraphConsumer & {
  owner: AddressOrENS;
  includeHiddenProtectedDatas: boolean;
}) {
  const collections = gql`
    query {
      collections(
        where: {
          owner: "${owner}",
        }
        orderBy: creationTimestamp
        orderDirection: asc
      ) {
        id
        owner {
          id
        }
        creationTimestamp
        protectedDatas(
          orderBy: creationTimestamp
          orderDirection: desc
          ${
            !includeHiddenProtectedDatas
              ? 'where: {or: [{ isForSale: true }{ isRentable: true }{ isIncludedInSubscription: true }]}'
              : ''
          }
        ) {
          id
          name
          creationTimestamp
          isForSale
          isRentable
          isIncludedInSubscription
          saleParams {
            id
            price
          }
          rentalParams {
            price
            duration
          }
          rentals {
            renter
            endDate
          }
        }
      }
    }
  `;

  return graphQLClient.request<GetCollectionsByOwnerResponse>(collections);
}
