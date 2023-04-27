import { IExec } from 'iexec';
import { WorkflowError } from '../utils/errors.js';
import { throwIfMissing } from '../utils/validators.js';
import { GraphQLClient, gql } from 'graphql-request';
import { ProtectedData } from './types.js';

interface Schema<T = string> {
  [key: string]: T | Schema<T>;
}

type data = {
  protectedDatas: Array<{ id: string; jsonSchema: string }>;
};

function flattenSchema(schema: Schema, parentKey = ''): string[] {
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
  iexec = throwIfMissing(),
  graphQLClient = throwIfMissing(),
  requiredSchema = {},
  owner = '',
}: {
  iexec: IExec;
  requiredSchema?: Schema;
  owner?: string | string[];
  graphQLClient: GraphQLClient;
}): Promise<ProtectedData[]> => {
  try {
    const schemaArray = flattenSchema(requiredSchema);
    const SchemaFilteredProtectedData = gql`
      query SchemaFilteredProtectedData($requiredSchema: [String!]!) {
        protectedDatas(where: { schema_contains: $requiredSchema }) {
          id
          jsonSchema
        }
      }
    `;

    const variables = { requiredSchema: schemaArray };
    let data: data = await graphQLClient.request(
      SchemaFilteredProtectedData,
      variables
    );
    const datasets = await Promise.all(
      data?.protectedDatas?.map(
        async ({ id, jsonSchema }: { id: string; jsonSchema: string }) => {
          try {
            const { ProtectedData: d } = await iexec.ProtectedData.showDataset(
              id
            );
            const schema = JSON.parse(jsonSchema);
            return { ...d, schema };
          } catch (error) {
            // Silently ignore the error to not return multiple errors in the console of the user
            return null;
          }
        }
      )
    ).then((results) => results.filter((item) => item !== null));

    return owner
      ? datasets.filter((d) => {
          if (Array.isArray(owner)) {
            return owner.includes(d.owner);
          }
          return d.owner === owner;
        })
      : datasets;
  } catch (error) {
    throw new WorkflowError(
      `Failed to fetch protected data : ${error.message}`,
      error
    );
  }
};
