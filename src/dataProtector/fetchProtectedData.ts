import { IExec } from 'iexec';
import { WorkflowError } from '../utils/errors';
import { throwIfMissing } from '../utils/validators';
import { Dataset } from './types';
import { gql, useQuery } from '@apollo/client';

export const fetchProtectedData = async ({
    iexec = throwIfMissing(),
    client = throwIfMissing(),
    restrictedSchema = "",
    restrictedOwner = "",
}: {
    iexec: IExec;
    restrictedSchema?: string;
    restrictedOwner?: string;
    client: any;
}): Promise<Dataset[]> => {
    try {
        const GET_SCHEMA = gql`
        query MyQuery($restrictedSchema: String!) {
            datasetSchemas(where: {schema_contains: $restrictedSchema}) {
              dataset
              schema
            }
          }`;
        const { loading, error, data } = useQuery(GET_SCHEMA, {
            variables: { restrictedSchema },
        });

        if (error) {
            throw new WorkflowError(
                `Failed to fetch granted access to this data: ${error.message}`,
                error
            );
        }

        while (loading) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        const datasets = await Promise.all(
            data?.datasetSchemas?.map(async ({ dataset, schema }: { dataset: string, schema: string }) => {
                const { dataset: d } = await iexec.dataset.showDataset(dataset);
                return { ...d, schema: JSON.parse(schema) };
            })
        );

        return restrictedOwner ? datasets.filter(d => d.owner === restrictedOwner) : datasets;

    } catch (error) {
        throw new WorkflowError(
            `Failed to fetch granted access to this data: ${error.message}`,
            error
        );
    }
};
