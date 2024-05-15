import { gql } from 'graphql-request';
import {
  ensureSearchableDataSchemaIsValid,
  reverseSafeSchema,
} from '../../utils/data.js';
import { ValidationError, WorkflowError } from '../../utils/errors.js';
import { resolveENS } from '../../utils/resolveENS.js';
import {
  addressOrEnsSchema,
  numberBetweenSchema,
  positiveNumberSchema,
  throwIfMissing,
} from '../../utils/validators.js';
import { ProtectedDatasGraphQLResponse } from '../types/graphQLTypes.js';
import {
  GetProtectedDataParams,
  ProtectedData,
  SearchableDataSchema,
} from '../types/index.js';
import { IExecConsumer, SubgraphConsumer } from '../types/internalTypes.js';

export const getProtectedData = async ({
  iexec = throwIfMissing(),
  graphQLClient = throwIfMissing(),
  protectedDataAddress,
  requiredSchema = {},
  owner,
  createdAfterTimestamp,
  page = 0,
  pageSize = 1000,
}: GetProtectedDataParams & IExecConsumer & SubgraphConsumer): Promise<
  ProtectedData[]
> => {
  const vCreationTimestampGte = positiveNumberSchema()
    .label('createdAfterTimestamp')
    .validateSync(createdAfterTimestamp);

  const vProtectedDataAddress = addressOrEnsSchema()
    .label('protectedDataAddress')
    .validateSync(protectedDataAddress);

  let vRequiredSchema: SearchableDataSchema;
  try {
    ensureSearchableDataSchemaIsValid(requiredSchema);
    vRequiredSchema = requiredSchema;
  } catch (e: any) {
    throw new ValidationError(`schema is not valid: ${e.message}`);
  }
  const vPage = positiveNumberSchema().label('page').validateSync(page);
  const vPageSize = numberBetweenSchema(10, 1000)
    .label('pageSize')
    .validateSync(pageSize);
  let vOwner = addressOrEnsSchema().label('owner').validateSync(owner);
  vOwner = await resolveENS(iexec, vOwner);
  try {
    const start = vPage * vPageSize;
    const range = vPageSize;

    const { requiredSchemas, oneOfSchemas } = flattenSchema(vRequiredSchema);

    const whereConditions = [];
    if (vProtectedDataAddress) {
      whereConditions.push(`{id:"${vProtectedDataAddress}"}`);
    }
    if (vOwner) {
      whereConditions.push(`{owner:"${vOwner}"}`);
    }
    if (vCreationTimestampGte) {
      whereConditions.push(
        `{creationTimestamp_gte:"${vCreationTimestampGte}"}`
      );
    }
    if (requiredSchemas.length > 0) {
      whereConditions.push(
        `{schema_contains:[${requiredSchemas
          .map((schemaFragment) => `"${schemaFragment}"`)
          .join(',')}]}`
      );
    }
    oneOfSchemas.forEach((oneOfSchema) => {
      whereConditions.push(
        `{or:[${oneOfSchema
          .map((schemaFragment) => `{schema_contains:["${schemaFragment}"]}`)
          .join(',')}]}`
      );
    });

    const whereFilter =
      whereConditions.length > 0
        ? `where:{and:[${whereConditions.join(',')}]}`
        : '';

    const SchemaFilteredProtectedData = gql`
      query ($start: Int!, $range: Int!) {
        protectedDatas(
          ${whereFilter}
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

function flattenSchema(
  schema: SearchableDataSchema,
  parentKey?: string
): { requiredSchemas: string[]; oneOfSchemas: string[][] } {
  return Object.entries(schema).reduce(
    (acc, [key, value]) => {
      const newKey = parentKey ? `${parentKey}.${key}` : key;
      if (Array.isArray(value)) {
        acc.oneOfSchemas.push(value.map((entry) => `${newKey}:${entry}`));
        return acc;
      }
      if (typeof value === 'object') {
        const { requiredSchemas, oneOfSchemas } = flattenSchema(value, newKey);
        acc.requiredSchemas.push(...requiredSchemas);
        acc.oneOfSchemas.push(...oneOfSchemas);
        return acc;
      }
      acc.requiredSchemas.push(`${newKey}:${value}`);
      return acc;
    },
    { requiredSchemas: [], oneOfSchemas: [] }
  );
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
          creationTimestamp: Number(protectedData.creationTimestamp),
        };
      } catch (error) {
        // Silently ignore the error to not return multiple errors in the console of the user
        return null;
      }
    })
    .filter((item) => item !== null);
}
