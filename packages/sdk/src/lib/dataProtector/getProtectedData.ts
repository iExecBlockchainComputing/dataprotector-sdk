import { gql } from 'graphql-request';
import {
  ensureDataSchemaIsValid,
  reverseSafeSchema,
} from '../../utils/data.js';
import { ValidationError, WorkflowError } from '../../utils/errors.js';
import {
  addressOrEnsSchema,
  isEnsTest,
  numberBetweenSchema,
  positiveNumberSchema,
  throwIfMissing,
} from '../../utils/validators.js';
import { ProtectedDatasGraphQLResponse } from '../types/graphQLTypes.js';
import {
  DataSchema,
  GetProtectedDataParams,
  IExecConsumer,
  ProtectedData,
  SubgraphConsumer,
} from '../types/index.js';

export const getProtectedData = async ({
  iexec = throwIfMissing(),
  graphQLClient = throwIfMissing(),
  requiredSchema = {},
  owner,
  creationTimestampGte,
  page = 0,
  pageSize = 1000,
}: GetProtectedDataParams & IExecConsumer & SubgraphConsumer): Promise<
  ProtectedData[]
> => {
  const vCreationTimestampGte = positiveNumberSchema()
    .label('creationTimestampGte')
    .validateSync(creationTimestampGte);

  let vRequiredSchema: DataSchema;
  try {
    ensureDataSchemaIsValid(requiredSchema);
    vRequiredSchema = requiredSchema;
  } catch (e: any) {
    throw new ValidationError(`schema is not valid: ${e.message}`);
  }
  let vOwner = addressOrEnsSchema().label('owner').validateSync(owner);
  if (vOwner && isEnsTest(vOwner)) {
    const resolved = await iexec.ens.resolveName(vOwner);
    if (!resolved) {
      throw new ValidationError('owner ENS name is not valid');
    }
    vOwner = resolved.toLowerCase();
  }
  const vPage = positiveNumberSchema().label('page').validateSync(page);
  const vPageSize = numberBetweenSchema(10, 1000)
    .label('pageSize')
    .validateSync(pageSize);
  try {
    const start = vPage * vPageSize;
    const range = vPageSize;

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
          ${
            vCreationTimestampGte
              ? `creationTimestamp_gte: "${vCreationTimestampGte}",`
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
      }
    }
  `;
    //in case of a large number of protected data, we need to paginate the query
    const variables = {
      requiredSchema: schemaArray,
      start,
      range,
    };
    const protectedDataResultQuery: ProtectedDatasGraphQLResponse =
      await graphQLClient.request(SchemaFilteredProtectedData, variables);
    const protectedDataArray: ProtectedData[] = transformGraphQLResponse(
      protectedDataResultQuery
    );
    return protectedDataArray;
  } catch (e) {
    console.error(e);
    throw new WorkflowError('Failed to fetch protected data', e);
  }
};

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

function transformGraphQLResponse(
  response: ProtectedDatasGraphQLResponse
): ProtectedData[] {
  return response.protectedDatas
    .map((protectedData) => {
      try {
        const schema = reverseSafeSchema(protectedData.schema);
        return {
          name: protectedData.name,
          address: protectedData.id,
          owner: protectedData.owner.id,
          schema,
          creationTimestamp: parseInt(protectedData.creationTimestamp),
        };
      } catch (error) {
        // Silently ignore the error to not return multiple errors in the console of the user
        return null;
      }
    })
    .filter((item) => item !== null);
}
