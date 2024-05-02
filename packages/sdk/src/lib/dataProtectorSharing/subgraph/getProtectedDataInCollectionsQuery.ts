import { gql } from 'graphql-request';
import { toHex } from '../../../utils/data.js';
import { throwIfMissing } from '../../../utils/validators.js';
import { ProtectedDatasInCollectionsGraphQLResponse } from '../../types/graphQLTypes.js';
import { GetProtectedDataInCollectionsParams } from '../../types/index.js';
import { SubgraphConsumer } from '../../types/internalTypes.js';

export const getProtectedDataInCollectionsQuery = async ({
  graphQLClient = throwIfMissing(),
  protectedData,
  collectionId,
  collectionOwner,
  createdAfterTimestamp,
  isRentable,
  isForSale,
  page,
  pageSize,
}: SubgraphConsumer &
  GetProtectedDataInCollectionsParams): Promise<ProtectedDatasInCollectionsGraphQLResponse> => {
  const start = page * pageSize;
  const range = pageSize;
  const collectionIdHex = collectionId && toHex(collectionId);

  const protectedDatas = gql`
    query (
      $start: Int!
      $range: Int!
    ) {
      protectedDatas(
        where: {
          transactionHash_not: "0x",
          ${protectedData ? `id: "${protectedData}",` : ''},
          ${isRentable ? `isRentable: ${isRentable},` : ''},
          ${isForSale ? `isForSale: ${isForSale},` : ''},
          ${
            collectionId
              ? `collection: "${collectionIdHex}",`
              : `collection_not: "null"`
          },
          ${
            collectionOwner
              ? `collection_ : { owner: "${collectionOwner}" }`
              : ''
          },
          ${
            createdAfterTimestamp
              ? `creationTimestamp_gte: "${createdAfterTimestamp}",`
              : ''
          }
        }
        skip: $start
        first: $range
        orderBy: creationTimestamp
        orderDirection: desc
      ) {
        id
        name
        creationTimestamp
        owner {
          id
        }
        collection {
          id
          owner {
            id
          }
        }
        isRentable
        rentalParams {
          price
          duration
        }
        rentals {
          renter,
          endDate
        }
        isForSale
        saleParams {
          price
        }
        isIncludedInSubscription
      }
    }
  `;

  //in case of a large number of protected data, we need to paginate the query
  const variables = {
    start,
    range,
  };

  return graphQLClient.request<ProtectedDatasInCollectionsGraphQLResponse>(
    protectedDatas,
    variables
  );
};
