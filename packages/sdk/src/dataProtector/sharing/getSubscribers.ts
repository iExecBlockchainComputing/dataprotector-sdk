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
} from '../types/index.js';
import { getCollectionSubscribers } from './subgraph/getCollectionSubscribers.js';
export const getSubscribers = async ({
  graphQLClient = throwIfMissing(),
  collectionTokenId,
}: SubscribeParams & SubgraphConsumer): Promise<GetSubscribersResponse> => {
  const vCollectionTokenId = positiveNumberSchema()
    .required()
    .label('collectionTokenId')
    .validateSync(collectionTokenId);

  const getSubscribersQueryResponse: GraphQLResponseSubscribers =
    await getCollectionSubscribers({
      collectionTokenId: vCollectionTokenId,
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
