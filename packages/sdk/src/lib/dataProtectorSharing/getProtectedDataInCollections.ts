import { reverseSafeSchema } from '../../utils/data.js';
import { WorkflowError } from '../../utils/errors.js';
import {
  addressSchema,
  numberBetweenSchema,
  positiveNumberSchema,
  throwIfMissing,
} from '../../utils/validators.js';
import { ProtectedDatasGraphQLResponse } from '../types/graphQLTypes.js';
import {
  GetProtectedDataInCollectionsParams,
  GetProtectedDataInCollectionsResponse,
  ProtectedDataInCollection,
} from '../types/index.js';
import { SubgraphConsumer } from '../types/internalTypes.js';
import { getProtectedDataInCollectionsQuery } from './subgraph/getProtectedDataInCollectionsQuery.js';

export const getProtectedDataInCollections = async ({
  graphQLClient = throwIfMissing(),
  collectionTokenId,
  collectionOwner,
  createdAfterTimestamp,
  page = 0,
  pageSize = 1000,
}: SubgraphConsumer &
  GetProtectedDataInCollectionsParams): Promise<GetProtectedDataInCollectionsResponse> => {
  const vCollectionTokenId = positiveNumberSchema()
    .label('collectionTokenId')
    .validateSync(collectionTokenId);
  // could accept ENS but should take iExec in args
  const vCollectionOwner = addressSchema()
    .label('collectionOwner')
    .validateSync(collectionOwner);
  const vCreatedAfterTimestamp = positiveNumberSchema()
    .label('createdAfterTimestamp')
    .validateSync(createdAfterTimestamp);
  const vPage = positiveNumberSchema().label('page').validateSync(page);
  const vPageSize = numberBetweenSchema(10, 1000)
    .label('pageSize')
    .validateSync(pageSize);

  try {
    const protectedDatasQueryResponse: ProtectedDatasGraphQLResponse =
      await getProtectedDataInCollectionsQuery({
        graphQLClient,
        collectionTokenId: vCollectionTokenId,
        collectionOwner: vCollectionOwner,
        createdAfterTimestamp: vCreatedAfterTimestamp,
        page: vPage,
        pageSize: vPageSize,
      });
    const protectedDataInCollection: ProtectedDataInCollection[] =
      protectedDatasQueryResponse.protectedDatas
        .map((protectedData) => {
          try {
            const schema = reverseSafeSchema(protectedData.schema);
            return {
              name: protectedData.name,
              address: protectedData.id,
              schema,
              collectionTokenId: Number(protectedData.collection.id),
              isIncludedInSubscription: protectedData.isIncludedInSubscription,
              isRentable: protectedData.isRentable,
              isForSale: protectedData.isForSale,
              creationTimestamp: parseInt(protectedData.creationTimestamp),
            };
          } catch (error) {
            // Silently ignore the error to not return multiple errors in the console of the user
            return null;
          }
        })
        .filter((item) => item !== null);
    return { protectedDataInCollection };
  } catch (e) {
    console.error(e);
    throw new WorkflowError('Failed to fetch protected data', e);
  }
};
