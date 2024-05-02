import { WorkflowError } from '../../utils/errors.js';
import { addressSchema, throwIfMissing } from '../../utils/validators.js';
import {
  GetCollectionsByOwnerResponse,
  GetCollectionsByOwnerParams,
} from '../types/index.js';
import { SubgraphConsumer } from '../types/internalTypes.js';
import { getCollectionsByOwnerQuery } from './subgraph/getCollectionsByOwnerQuery.js';

export async function getCollectionsByOwner({
  graphQLClient = throwIfMissing(),
  owner,
  includeHiddenProtectedDatas = false,
}: SubgraphConsumer &
  GetCollectionsByOwnerParams): Promise<GetCollectionsByOwnerResponse> {
  try {
    const vOwner = addressSchema()
      .required()
      .label('owner')
      .validateSync(owner);

    const getCollectionsByOwnerQueryResponse = await getCollectionsByOwnerQuery(
      {
        graphQLClient,
        owner: vOwner,
      }
    );

    /**
     * With graph-node >= 0.30.0, possible query:
     * {
     *   protectedDatas(where: {
     *     or: [
     *       { isRentable: true },
     *       { isIncludedInSubscription: true },
     *       { isForSale: true },
     *     ]
     *   }) {
     *     id
     *   }
     * }
     * hence no need of this JS post filter!
     */
    if (!includeHiddenProtectedDatas) {
      return {
        collections: getCollectionsByOwnerQueryResponse.collections.map(
          (collection) => {
            return {
              ...collection,
              protectedDatas: collection.protectedDatas.filter(
                (protectedData) =>
                  protectedData.isRentable ||
                  protectedData.isIncludedInSubscription ||
                  protectedData.isForSale
              ),
            };
          }
        ),
      };
    }

    return getCollectionsByOwnerQueryResponse;
  } catch (e) {
    console.log('[getCollectionsByOwner] ERROR', e);
    throw new WorkflowError('Failed to get collections by owner', e);
  }
}
