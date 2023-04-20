import { IExec } from 'iexec';
import { WorkflowError } from '../utils/errors';
import { throwIfMissing } from '../utils/validators';
import { Dataset } from './types';
import { GraphQLClient, gql } from 'graphql-request';

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
  requireSchema = {},
  owner = '',
}: {
  iexec: IExec;
  requireSchema?: Schema;
  owner?: string | string[];
  graphQLClient: GraphQLClient;
}): Promise<Dataset[]> => {
  try {
    const schemaArray = flattenSchema(requireSchema);
    const query = gql`
      query MyQuery($requireSchema: [String!]!) {
        protectedDatas(where: { schema_contains: $requireSchema }) {
          id
          jsonSchema
        }
      }
    `;

    const variables = { requireSchema: schemaArray };
    let data: data = await graphQLClient.request(query, variables);
    const datasets = await Promise.all(
      data?.protectedDatas?.map(
        async ({ id, jsonSchema }: { id: string; jsonSchema: string }) => {
          try {
            const { dataset: d } = await iexec.dataset.showDataset(id);
            const schema = JSON.parse(jsonSchema);
            return { ...d, schema };
          } catch (error) {
            // Silently ignore the error to not return multiple errors in the console of the user
            return null;
          }
        }
      )
    ).then((results) => results.filter((item) => item !== null));

    console.log('datasets', datasets);

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
