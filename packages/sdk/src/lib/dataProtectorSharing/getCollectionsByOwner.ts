import { WorkflowError } from '../../utils/errors.js';
import { addressSchema, throwIfMissing } from '../../utils/validators.js';
import { GetCollectionsByOwnerGraphQLResponse } from '../types/graphQLTypes.js';
import type {
  Address,
  GetCollectionsByOwnerResponse,
  OneCollectionByOwnerResponse,
} from '../types/index.js';
import { SubgraphConsumer } from '../types/internalTypes.js';
import { getCollectionsByOwnerQuery } from './subgraph/getCollectionsByOwnerQuery.js';

export async function getCollectionsByOwner({
  graphQLClient = throwIfMissing(),
  ownerAddress,
}: SubgraphConsumer & {
  ownerAddress: Address;
}): Promise<GetCollectionsByOwnerResponse> {
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

    // Map response fields to match GetCollectionsByOwnerResponse type
    const oneCollectionByOwner: OneCollectionByOwnerResponse[] =
      getCollectionsByOwnerQueryResponse.collections.map((collection) => ({
        id: collection.id,
        creationTimestamp: collection.creationTimestamp,
        protectedDatas: collection.protectedDatas.map((protectedData) => ({
          address: protectedData.id,
          name: protectedData.name,
          creationTimestamp: protectedData.creationTimestamp,
          isRentable: protectedData.isRentable,
          isIncludedInSubscription: protectedData.isIncludedInSubscription,
        })),
        subscriptionParams: {
          price: collection.subscriptionParams.price,
          duration: collection.subscriptionParams.duration,
        },
        subscriptions: collection.subscriptions.map((subscription) => ({
          subscriber: {
            address: subscription.subscriber.id,
          },
          endDate: subscription.endDate,
        })),
      }));

    return { collections: oneCollectionByOwner };
  } catch (e) {
    throw new WorkflowError('getCollectionsByOwner subgraph error', e);
  }
}
