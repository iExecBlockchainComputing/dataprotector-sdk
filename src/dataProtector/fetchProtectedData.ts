import { IExec } from 'iexec';
import { WorkflowError } from '../utils/errors';
import { throwIfMissing } from '../utils/validators';
import { Dataset } from './types';
import { GraphQLClient, gql } from 'graphql-request';

type data = {
  protectedDatas: Array<{ id: string; jsonSchema: string }>;
};

export const fetchProtectedData = async ({
  iexec = throwIfMissing(),
  graphQLClient = throwIfMissing(),
  restrictedSchema = '',
  restrictedOwner = '',
}: {
  iexec: IExec;
  restrictedSchema?: string;
  restrictedOwner?: string;
  graphQLClient: GraphQLClient;
}): Promise<Dataset[]> => {
  try {
    const query = gql`
      query MyQuery($restrictedSchema: String!) {
        protectedDatas(where: { schema_: { id: $restrictedSchema } }) {
          id
          jsonSchema
        }
      }
    `;

    const variables = { restrictedSchema: restrictedSchema };
    let data: data = await graphQLClient.request(query, variables);
    console.log('data', data);
    const datasets = await Promise.all(
      data?.protectedDatas?.map(
        async ({ id, jsonSchema }: { id: string; jsonSchema: string }) => {
          const { dataset: d } = await iexec.dataset.showDataset(id);
          return { ...d, schema: JSON.parse(jsonSchema) };
        }
      )
    );

    return restrictedOwner
      ? datasets.filter((d) => d.owner === restrictedOwner)
      : datasets;
  } catch (error) {
    throw new WorkflowError(
      `Failed to fetch granted access to this data: ${error.message}`,
      error
    );
  }
};
