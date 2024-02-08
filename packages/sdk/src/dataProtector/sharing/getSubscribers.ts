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
  collectionId,
}: SubscribeParams & SubgraphConsumer): Promise<GetSubscribersResponse> => {
  const vCollectionId = positiveNumberSchema()
    .required()
    .label('collectionId')
    .validateSync(collectionId);

  const getSubscribersQueryResponse: GraphQLResponseSubscribers =
    await getCollectionSubscribers({
      collectionId: vCollectionId,
      graphQLClient,
    });

  const subscribers: Subscriber[] =
    getSubscribersQueryResponse.collectionSubscriptions.map((item) => ({
      address: item.subscriber.id,
      endSubscriptionTimestamp: parseInt(item.endDate),
    }));

  const result: GetSubscribersResponse = {
    subscribers,
  };
  return result;
};
