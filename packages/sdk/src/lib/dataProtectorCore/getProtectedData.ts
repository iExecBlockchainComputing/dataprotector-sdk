import { gql } from 'graphql-request';
import {
  ensureSearchableDataSchemaIsValid,
  reverseSafeSchema,
} from '../../utils/data.js';
import { ValidationError, WorkflowError } from '../../utils/errors.js';
import { getMultiaddrAsString } from '../../utils/getMultiaddrAsString.js';
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
    throw new ValidationError(`requiredSchema is not valid: ${e.message}`);
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

    const { requiredSchemas, anyOfSchemas } = flattenSchema(vRequiredSchema);

    const whereFilters = [];
    if (vProtectedDataAddress) {
      whereFilters.push({ id: vProtectedDataAddress });
    }
    if (vOwner) {
      whereFilters.push({ owner: vOwner });
    }
    if (vCreationTimestampGte) {
      whereFilters.push({ creationTimestamp_gte: vCreationTimestampGte });
    }
    if (requiredSchemas.length > 0) {
      whereFilters.push({ schema_contains: requiredSchemas });
    }
    anyOfSchemas.forEach((anyOfSchema) => {
      whereFilters.push({
        or: anyOfSchema.map((schemaFragment) => ({
          schema_contains: [schemaFragment],
        })),
      });
    });

    const filteredProtectedDataQuery = gql`
      query ($start: Int!, $range: Int!, $where: ProtectedData_filter) {
        protectedDatas(
          where: $where
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
          multiaddr
        }
      }
    `;
    //in case of a large number of protected data, we need to paginate the query
    const variables = {
      where:
        whereFilters.length > 0
          ? {
              and: whereFilters,
            }
          : undefined,
      start,
      range,
    };
    const protectedDataResultQuery: ProtectedDatasGraphQLResponse =
      await graphQLClient.request(filteredProtectedDataQuery, variables);
    const protectedDataArray: ProtectedData[] = transformGraphQLResponse(
      protectedDataResultQuery
    );
    return protectedDataArray;
  } catch (e) {
    throw new WorkflowError({
      message: 'Failed to fetch protected data',
      errorCause: e,
    });
  }
};

function flattenSchema(
  schema: SearchableDataSchema,
  parentKey?: string
): { requiredSchemas: string[]; anyOfSchemas: string[][] } {
  return Object.entries(schema).reduce(
    (acc, [key, value]) => {
      const newKey = parentKey ? `${parentKey}.${key}` : key;
      // Array of possible types
      if (Array.isArray(value)) {
        if (value.length > 1) {
          // one of many
          acc.anyOfSchemas.push(value.map((entry) => `${newKey}:${entry}`));
        } else {
          // Array of only one type. Similar to single type.
          acc.requiredSchemas.push(...value);
        }
      }
      // nested schema
      else if (typeof value === 'object') {
        const { requiredSchemas, anyOfSchemas } = flattenSchema(value, newKey);
        acc.requiredSchemas.push(...requiredSchemas);
        acc.anyOfSchemas.push(...anyOfSchemas);
      }
      // single type
      else {
        acc.requiredSchemas.push(`${newKey}:${value}`);
      }
      return acc;
    },
    { requiredSchemas: [], anyOfSchemas: [] }
  );
}

function transformGraphQLResponse(
  response: ProtectedDatasGraphQLResponse
): ProtectedData[] {
  return response.protectedDatas
    .map((protectedData) => {
      try {
        const schema = reverseSafeSchema(protectedData.schema);
        const readableMultiAddr = getMultiaddrAsString({
          multiaddrAsHexString: protectedData.multiaddr,
        });
        return {
          name: protectedData.name,
          address: protectedData.id,
          owner: protectedData.owner.id,
          schema,
          creationTimestamp: Number(protectedData.creationTimestamp),
          multiaddr: readableMultiAddr,
        };
      } catch (error) {
        // Silently ignore the error to not return multiple errors in the console of the user
        return null;
      }
    })
    .filter((item) => item !== null);
}
