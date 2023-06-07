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
  range = 1000,
  start = 0,
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
    const variables = {
      requiredSchema: schemaArray,
      start,
      range,
    };
    let protectedDataResultQuery: GraphQLResponse = await graphQLClient.request(
      SchemaFilteredProtectedData,
      variables
    );
    let protectedDataArray: ProtectedData[] = transformGraphQLResponse(
      protectedDataResultQuery
    );
    return protectedDataArray;
  } catch (error) {
    throw new WorkflowError(
      `Failed to fetch protected data: ${error.message}`,
      error
    );
  }
};
