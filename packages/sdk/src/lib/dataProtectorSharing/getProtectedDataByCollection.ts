import { gql } from 'graphql-request';
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
  SharingContractConsumer,
  SubgraphConsumer,
} from '../types/index.js';

export const getProtectedDataByCollection = async ({
  graphQLClient = throwIfMissing(),
  sharingContractAddress = throwIfMissing(),
  collectionTokenId,
  creationTimestampGte,
  page = 0,
  pageSize = 1000,
}: SubgraphConsumer &
  SharingContractConsumer &
  GetProtectedDataByCollectionParams): Promise<ProtectedDataInCollection[]> => {
  const vPage = positiveNumberSchema().label('page').validateSync(page);
  const vPageSize = numberBetweenSchema(10, 1000)
    .label('pageSize')
    .validateSync(pageSize);
  try {
    const start = vPage * vPageSize;
    const range = vPageSize;

    const SchemaFilteredProtectedData = gql`
    query (
      $start: Int!
      $range: Int!
    ) {
      protectedDatas(
        where: {
          transactionHash_not: "0x", 
          owner: "${sharingContractAddress}",
          ${
            creationTimestampGte
              ? `creationTimestamp_gte: "${creationTimestampGte}",`
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
