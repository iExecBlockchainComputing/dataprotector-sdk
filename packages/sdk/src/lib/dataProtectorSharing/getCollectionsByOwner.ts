import { WorkflowError } from '../../utils/errors.js';
import { addressSchema, throwIfMissing } from '../../utils/validators.js';
import { GetCollectionsByOwnerGraphQLResponse } from '../types/graphQLTypes.js';
import {
  GetCollectionsByOwnerResponse,
  GetCollectionsByOwnerParams,
} from '../types/index.js';
import { SubgraphConsumer } from '../types/internalTypes.js';
import { getCollectionsByOwnerQuery } from './subgraph/getCollectionsByOwnerQuery.js';

export async function getCollectionsByOwner({
  graphQLClient = throwIfMissing(),
  ownerAddress,
  includeHiddenProtectedDatas = false,
}: SubgraphConsumer &
  GetCollectionsByOwnerParams): Promise<GetCollectionsByOwnerResponse> {
  try {
    const vOwnerAddress = addressSchema()
      .required()
      .label('protectedDataAddress')
      .validateSync(ownerAddress);

    const getCollectionsByOwnerQueryResponse: GetCollectionsByOwnerGraphQLResponse =
      await getCollectionsByOwnerQuery({
        graphQLClient,
        ownerAddress: vOwnerAddress,
      });

    // const toto = getCollectionsByOwnerQueryResponse.collections[0].id;
    // console.log('typeof toto', typeof toto);

    // Map response fields to match GetCollectionsByOwnerResponse type
    // const collectionsByOwner: CollectionWithProtectedDatas[] =
    //   getCollectionsByOwnerQueryResponse.collections.map((collection) => ({
    //     id: Number(collection.id),
    //     creationTimestamp: collection.creationTimestamp,
    //     protectedDatas: collection.protectedDatas.map((protectedData) => ({
    //       address: protectedData.id,
    //       name: protectedData.name,
    //       creationTimestamp: protectedData.creationTimestamp,
    //       isRentable: protectedData.isRentable,
    //       isIncludedInSubscription: protectedData.isIncludedInSubscription,
    //     })),
    //     subscriptionParams: {
    //       price: collection.subscriptionParams?.price,
    //       duration: collection.subscriptionParams?.duration,
    //     },
    //     subscriptions: collection.subscriptions.map((subscription) => ({
    //       subscriber: {
    //         address: subscription.subscriber.id,
    //       },
    //       endDate: subscription.endDate,
    //     })),
    //   }));

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
    console.log('e', e);
    throw new WorkflowError('Failed to get collections by owner', e);
  }
}
