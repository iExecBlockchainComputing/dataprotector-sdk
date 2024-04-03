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
  protectedDataAddress,
  collectionTokenId,
  collectionOwner,
  createdAfterTimestamp,
  isRentable,
  isForSale,
  page = 0,
  pageSize = 1000,
}: SubgraphConsumer &
  GetProtectedDataInCollectionsParams): Promise<GetProtectedDataInCollectionsResponse> => {
  const vProtectedDataAddress = addressSchema()
    .label('protectedDataAddress')
    .validateSync(protectedDataAddress);
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
  // TODO Check isRentable = undefined | true
  // TODO Check isForSale = undefined | true
  const vPage = positiveNumberSchema().label('page').validateSync(page);
  const vPageSize = numberBetweenSchema(10, 1000)
    .label('pageSize')
    .validateSync(pageSize);

  try {
    const protectedDatasQueryResponse: ProtectedDatasGraphQLResponse =
      await getProtectedDataInCollectionsQuery({
        graphQLClient,
        protectedDataAddress: vProtectedDataAddress,
        collectionTokenId: vCollectionTokenId,
        collectionOwner: vCollectionOwner,
        createdAfterTimestamp: vCreatedAfterTimestamp,
        isRentable,
        isForSale,
        page: vPage,
        pageSize: 1,
      });
    const protectedDataInCollection: ProtectedDataInCollection[] =
      protectedDatasQueryResponse.protectedDatas
        .map((protectedData) => {
          return {
            address: protectedData.id,
            ...protectedData,
          };
        })
        .filter((item) => item !== null);
    return { protectedDataInCollection };
  } catch (e) {
    throw new WorkflowError('Failed to get protected data in collections', e);
  }
};
