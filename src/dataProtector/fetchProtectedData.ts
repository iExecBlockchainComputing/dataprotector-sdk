import { ValidationError, WorkflowError } from '../utils/errors.js';
import { addressSchema, throwIfMissing } from '../utils/validators.js';
import { gql } from 'graphql-request';
import {
  FetchProtectedDataParams,
  DataSchema,
  ProtectedData,
  SubgraphConsumer,
  GraphQLResponse,
} from './types.js';
import {
  ensureDataSchemaIsValid,
  transformGraphQLResponse,
} from '../utils/data.js';

function flattenSchema(schema: DataSchema, parentKey = ''): string[] {
  return Object.entries(schema).flatMap(([key, value]) => {
    const newKey = parentKey ? `${parentKey}.${key}` : key;
    if (typeof value === 'object') {
      return flattenSchema(value, newKey);
    } else {
      return `${newKey}:${value}`;
    }
  });
}

export const fetchProtectedData = async ({
  graphQLClient = throwIfMissing(),
  requiredSchema = {},
  owner,
}: FetchProtectedDataParams & SubgraphConsumer): Promise<ProtectedData[]> => {
  let vRequiredSchema: DataSchema;
  try {
    ensureDataSchemaIsValid(requiredSchema);
    vRequiredSchema = requiredSchema;
  } catch (e: any) {
    throw new ValidationError(`schema is not valid: ${e.message}`);
  }
  let vOwner: string = addressSchema().label('owner').validateSync(owner);
  try {
    const schemaArray = flattenSchema(vRequiredSchema);
    const SchemaFilteredProtectedData = gql`
    query (
      $requiredSchema: [String!]!
      $start: Int!
      $range: Int!
    ) {
      protectedDatas(
        where: {
          transactionHash_not: "0x", 
          schema_contains: $requiredSchema, 
          ${vOwner ? `owner: "${vOwner}",` : ''}
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
        jsonSchema
        creationTimestamp
      }
    }
  `;

    // Pagination
    let allProtectedDataArray: ProtectedData[] = [];
    let start = 0;
    const range = 1000;
    let continuePagination = true;

    while (continuePagination) {
      const variables = {
        requiredSchema: schemaArray,
        start: start,
        range: range,
      };

      let protectedDataResultQuery: GraphQLResponse =
        await graphQLClient.request(SchemaFilteredProtectedData, variables);

      let protectedDataArray: ProtectedData[] = transformGraphQLResponse(
        protectedDataResultQuery
      );

      allProtectedDataArray = [...allProtectedDataArray, ...protectedDataArray];

      if (protectedDataArray.length < range) {
        continuePagination = false;
      } else {
        start += range;
      }
    }

    return allProtectedDataArray;
  } catch (error) {
    throw new WorkflowError(
      `Failed to fetch protected data : ${error.message}`,
      error
    );
  }
};
