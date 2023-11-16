import { gql } from 'graphql-request';
import {
  ensureDataSchemaIsValid,
  transformGraphQLResponse,
} from '../utils/data.js';
import { ValidationError, WorkflowError } from '../utils/errors.js';
import {
  PageSizeStringSchema,
  addressSchema,
  positiveIntegerStringSchema,
  throwIfMissing,
} from '../utils/validators.js';
import {
  DataSchema,
  FetchProtectedDataParams,
  GraphQLResponse,
  ProtectedData,
  SubgraphConsumer,
} from './types.js';

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
  page = DEFAULT_PAGE,
  pageSize = DEFAULT_PAGE_SIZE,
}: FetchProtectedDataParams & SubgraphConsumer): Promise<ProtectedData[]> => {
  let vRequiredSchema: DataSchema;
  try {
    ensureDataSchemaIsValid(requiredSchema);
    vRequiredSchema = requiredSchema;
  } catch (e: any) {
    throw new ValidationError(`schema is not valid: ${e.message}`);
  }
  const vOwner: string = addressSchema().label('owner').validateSync(owner);
  const vPage = positiveIntegerStringSchema().label('page').validateSync(page);
  const vPageSize = PageSizeStringSchema()
    .label('pageSize')
    .validateSync(pageSize);
  try {
    const start = +vPage * +vPageSize;
    const range = +vPageSize;

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
    //in case of a large number of protected data, we need to paginate the query
    const variables = {
      requiredSchema: schemaArray,
      start,
      range,
    };
    const protectedDataResultQuery: GraphQLResponse =
      await graphQLClient.request(SchemaFilteredProtectedData, variables);
    const protectedDataArray: ProtectedData[] = transformGraphQLResponse(
      protectedDataResultQuery
    );
    return protectedDataArray;
  } catch (e) {
    throw new WorkflowError('Failed to fetch protected data', e);
  }
};
