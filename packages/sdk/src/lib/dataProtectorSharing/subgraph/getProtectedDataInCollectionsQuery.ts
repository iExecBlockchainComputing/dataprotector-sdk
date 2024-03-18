import { gql } from 'graphql-request';
import { toHex } from '../../../utils/data.js';
import { throwIfMissing } from '../../../utils/validators.js';
import { ProtectedDatasGraphQLResponse } from '../../types/graphQLTypes.js';
import { GetProtectedDataInCollectionsParams } from '../../types/index.js';
import { SubgraphConsumer } from '../../types/internalTypes.js';

export const getProtectedDataInCollectionsQuery = async ({
  graphQLClient = throwIfMissing(),
  collectionTokenId,
  collectionOwner,
  createdAfterTimestamp,
  page,
  pageSize,
}: SubgraphConsumer &
  GetProtectedDataInCollectionsParams): Promise<ProtectedDatasGraphQLResponse> => {
  const start = page * pageSize;
  const range = pageSize;
  const collectionTokenIdHex = collectionTokenId && toHex(collectionTokenId);

  const SchemaFilteredProtectedData = gql`
    query (
      $start: Int!
      $range: Int!
    ) {
      protectedDatas(
        where: {
          transactionHash_not: "0x",
          ${
            createdAfterTimestamp
              ? `creationTimestamp_gte: "${createdAfterTimestamp}",`
              : ''
          },
          ${
            collectionTokenId
              ? `collection: "${collectionTokenIdHex}",`
              : `collection_not: "null"`
          },
          ${
            collectionOwner
              ? `collection_ : { owner: "${collectionOwner}" }`
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
        owner {
          id
        }
        schema {
          id
        }
        collection {
          id
        }
        isIncludedInSubscription
        isRentable
        isForSale
        creationTimestamp
      }
    }
  `;
  //in case of a large number of protected data, we need to paginate the query
  const variables = {
    start,
    range,
  };
  const protectedDataResultQuery: ProtectedDatasGraphQLResponse =
    await graphQLClient.request(SchemaFilteredProtectedData, variables);
  return protectedDataResultQuery;
};
