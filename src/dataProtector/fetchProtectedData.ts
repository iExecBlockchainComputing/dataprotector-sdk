import { ValidationError, WorkflowError } from '../utils/errors.js';
import { addressSchema, throwIfMissing } from '../utils/validators.js';
import { gql } from 'graphql-request';
import {
  FetchProtectedDataParams,
  DataSchema,
  ProtectedData,
  IExecConsumer,
  SubgraphConsumer,
} from './types.js';
import { ensureDataSchemaIsValid } from '../utils/data.js';

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
  owner,
}: FetchProtectedDataParams & IExecConsumer & SubgraphConsumer): Promise<
  ProtectedData[]
> => {
  let vRequiredSchema: DataSchema;
  try {
    ensureDataSchemaIsValid(requiredSchema);
    vRequiredSchema = requiredSchema;
  } catch (e: any) {
    throw new ValidationError(`schema is not valid: ${e.message}`);
  }
  let vOwner: string | string[];
  if (Array.isArray(owner)) {
    vOwner = owner.map((address, index) =>
      addressSchema().required().label(`owner[${index}]`).validateSync(address)
    );
  } else {
    vOwner = addressSchema().label('owner').validateSync(owner);
  }
  try {
    const schemaArray = flattenSchema(vRequiredSchema);
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

    if (vOwner && typeof vOwner === 'string') {
      return protectedDataArray.filter(
        (protectedData) =>
          protectedData.owner === (vOwner as string).toLowerCase()
      );
    }
    if (vOwner && Array.isArray(vOwner)) {
      return protectedDataArray.filter((protectedData) =>
        (vOwner as string[])
          .map((o) => o.toLowerCase())
          .includes(protectedData.owner)
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
