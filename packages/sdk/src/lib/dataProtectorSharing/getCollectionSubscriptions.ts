import {
  positiveNumberSchema,
  throwIfMissing,
} from '../../utils/validators.js';
import { GetCollectionSubscribersGraphQLResponse } from '../types/graphQLTypes.js';
import {
  GetCollectionSubscriptionsResponse,
  SubscribeToCollectionParams,
  CollectionSubscription,
} from '../types/index.js';
import { SubgraphConsumer } from '../types/internalTypes.js';
import { getCollectionSubscriptionsQuery } from './subgraph/getCollectionSubscriptionsQuery.js';

export const getCollectionSubscriptions = async ({
  graphQLClient = throwIfMissing(),
  collectionTokenId,
}: SubgraphConsumer &
  SubscribeToCollectionParams): Promise<GetCollectionSubscriptionsResponse> => {
  const vCollectionTokenId = positiveNumberSchema()
    .required()
    .label('collectionTokenId')
    .validateSync(collectionTokenId);

  const getCollectionSubscriptionsQueryResponse: GetCollectionSubscribersGraphQLResponse =
    await getCollectionSubscriptionsQuery({
      graphQLClient,
      collectionTokenId: vCollectionTokenId,
    });

  const collectionSubscriptions: CollectionSubscription[] =
    getCollectionSubscriptionsQueryResponse.collectionSubscriptions.map(
      (item) => ({
        userAddress: item.subscriber.id,
        endSubscriptionTimestamp: parseInt(item.endDate),
      })
    );

  return {
    collectionSubscriptions,
  };
};
