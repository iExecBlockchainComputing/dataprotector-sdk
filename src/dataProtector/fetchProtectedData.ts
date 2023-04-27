import { IExec } from 'iexec';
import { WorkflowError } from '../utils/errors.js';
import { throwIfMissing } from '../utils/validators.js';
import { GraphQLClient, gql } from 'graphql-request';
import { DataSchema, ProtectedData } from './types.js';

type data = {
  protectedDatas: Array<{ id: string; jsonSchema: string }>;
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

export const fetchProtectedData = async ({
  iexec = throwIfMissing(),
  graphQLClient = throwIfMissing(),
  requiredSchema = {},
  owner = '',
}: {
  iexec: IExec;
  requiredSchema?: DataSchema;
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
    // todo: this implementation is highly inefficient with a large number of protectedData, we should index the dataset field in the sugraph to enable graphnode-side filtering on owner
    const protectedDataArray = await Promise.all(
      data?.protectedDatas?.map(async ({ id, jsonSchema }) => {
        try {
          const schema = JSON.parse(jsonSchema);
          const { dataset } = await iexec.dataset.showDataset(id);
          return {
            address: id,
            name: dataset.datasetName,
            owner: dataset.owner.toLowerCase(),
            schema,
          };
        } catch (error) {
          // Silently ignore the error to not return multiple errors in the console of the user
          return null;
        }
      })
    ).then((results) => results.filter((item) => item !== null));

    if (owner && typeof owner === 'string') {
      return protectedDataArray.filter(
        (protectedData) => protectedData.owner === owner.toLowerCase()
      );
    }
    if (owner && Array.isArray(owner)) {
      return protectedDataArray.filter((protectedData) =>
        owner.map((o) => o.toLowerCase()).includes(protectedData.owner)
      );
    }
    return protectedDataArray;
  } catch (error) {
    throw new WorkflowError(
      `Failed to fetch protected data : ${error.message}`,
      error
    );
  }
};
