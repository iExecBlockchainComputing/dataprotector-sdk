import { WorkflowError } from '../../utils/errors.js';
import {
  addressSchema,
  booleanSchema,
  numberBetweenSchema,
  positiveNumberSchema,
  throwIfMissing,
} from '../../utils/validators.js';
import {
  GetProtectedDataInCollectionsParams,
  GetProtectedDataInCollectionsResponse,
} from '../types/index.js';
import { SubgraphConsumer } from '../types/internalTypes.js';
import { getProtectedDataInCollectionsQuery } from './subgraph/getProtectedDataInCollectionsQuery.js';

export const getProtectedDataInCollections = async ({
  graphQLClient = throwIfMissing(),
  protectedData,
  collectionTokenId,
  collectionOwner,
  createdAfterTimestamp,
  isRentable,
  isForSale,
  page = 0,
  pageSize = 1000,
}: SubgraphConsumer &
  GetProtectedDataInCollectionsParams): Promise<GetProtectedDataInCollectionsResponse> => {
  const vProtectedData = addressSchema()
    .label('protectedData')
    .validateSync(protectedData);

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

  const vIsRentable = booleanSchema()
    .label('isRentable')
    .validateSync(isRentable);

  const vIsForSale = booleanSchema().label('isForSale').validateSync(isForSale);

  const vPage = positiveNumberSchema().label('page').validateSync(page);

  const vPageSize = numberBetweenSchema(10, 1000)
    .label('pageSize')
    .validateSync(pageSize);

  try {
    const protectedDatasQueryResponse =
      await getProtectedDataInCollectionsQuery({
        graphQLClient,
        protectedData: vProtectedData,
        collectionTokenId: vCollectionTokenId,
        collectionOwner: vCollectionOwner,
        createdAfterTimestamp: vCreatedAfterTimestamp,
        isRentable: vIsRentable,
        isForSale: vIsForSale,
        page: vPage,
        pageSize: vPageSize,
      });
    const protectedDataInCollection = protectedDatasQueryResponse.protectedDatas
      .map((oneProtectedData) => {
        return {
          address: oneProtectedData.id,
          ...oneProtectedData,
        };
      })
      .filter((item) => item !== null);
    return { protectedDataInCollection };
  } catch (e) {
    throw new WorkflowError('Failed to get protected data in collections', e);
  }
};
