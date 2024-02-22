import { gql } from 'graphql-request';
import { toHex } from '../../utils/data.js';
import { WorkflowError } from '../../utils/errors.js';
import {
  numberBetweenSchema,
  positiveNumberSchema,
  throwIfMissing,
} from '../../utils/validators.js';
import { ProtectedDatasGraphQLResponse } from '../types/graphQLTypes.js';
import {
  GetProtectedDataByCollectionParams,
  ProtectedDataInCollection,
  SubgraphConsumer,
} from '../types/index.js';

export const getProtectedDataByCollection = async ({
  graphQLClient = throwIfMissing(),
  collectionTokenId,
  creationTimestampGte,
  page = 0,
  pageSize = 1000,
}: SubgraphConsumer & GetProtectedDataByCollectionParams): Promise<
  ProtectedDataInCollection[]
> => {
  const vCollectionTokenId = positiveNumberSchema()
    .label('collectionTokenId')
    .validateSync(collectionTokenId);
  const vCreationTimestampGte = positiveNumberSchema()
    .label('creationTimestampGte')
    .validateSync(creationTimestampGte);

  const vPage = positiveNumberSchema().label('page').validateSync(page);
  const vPageSize = numberBetweenSchema(10, 1000)
    .label('pageSize')
    .validateSync(pageSize);

  try {
    const start = vPage * vPageSize;
    const range = vPageSize;
    const collectionTokenIdHex = toHex(vCollectionTokenId);

    const SchemaFilteredProtectedData = gql`
    query (
      $start: Int!
      $range: Int!
    ) {
      protectedDatas(
        where: {
          transactionHash_not: "0x", ,
          ${
            vCreationTimestampGte
              ? `creationTimestamp_gte: "${vCreationTimestampGte}",`
              : ''
          }
          ${
            vCollectionTokenId
              ? `collection: "${collectionTokenIdHex}",`
              : `collection_not: "null"`
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
        creationTimestamp
        collection {
          id
        }
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
    const protectedDataArray: ProtectedDataInCollection[] =
      transformGraphQLResponse(protectedDataResultQuery);
    return protectedDataArray;
  } catch (e) {
    console.error(e);
    throw new WorkflowError('Failed to fetch protected data', e);
  }
};

function transformGraphQLResponse(
  response: ProtectedDatasGraphQLResponse
): ProtectedDataInCollection[] {
  return response.protectedDatas
    .map((protectedData) => {
      try {
        return {
          name: protectedData.name,
          address: protectedData.id,
          collectionTokenId: Number(protectedData.collection.id),
          creationTimestamp: parseInt(protectedData.creationTimestamp),
        };
      } catch (error) {
        // Silently ignore the error to not return multiple errors in the console of the user
        return null;
      }
    })
    .filter((item) => item !== null);
}
