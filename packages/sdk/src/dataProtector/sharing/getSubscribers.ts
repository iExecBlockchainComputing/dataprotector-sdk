import {
  positiveNumberSchema,
  throwIfMissing,
} from '../../utils/validators.js';
import {
  GetSubscribersResponse,
  GraphQLResponseSubscribers,
  SubgraphConsumer,
  SubscribeParams,
  Subscriber,
} from '../types.js';
import { getCollectionSubscribers } from './subgraph/getCollectionSubscribers.js';
export const getSubscribers = async ({
  graphQLClient = throwIfMissing(),
  collectionTokenId,
}: SubscribeParams & SubgraphConsumer): Promise<GetSubscribersResponse> => {
  const vCollectionId = positiveNumberSchema()
    .required()
    .label('collectionId')
    .validateSync(collectionTokenId);

  const getSubscribersQueryResponse: GraphQLResponseSubscribers =
    await getCollectionSubscribers({
      collectionTokenId: vCollectionId,
      graphQLClient,
    });

  const subscribers: Subscriber[] =
    getSubscribersQueryResponse.collectionSubscriptions.map((item) => ({
      address: item.subscriber.id,
      endSubscriptionTimestamp: parseInt(item.endDate),
    }));

  return {
    subscribers,
  };
};
