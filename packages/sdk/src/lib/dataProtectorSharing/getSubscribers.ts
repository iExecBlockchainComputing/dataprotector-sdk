import {
  positiveNumberSchema,
  throwIfMissing,
} from '../../utils/validators.js';
import { GetCollectionSubscribersGraphQLResponse } from '../types/graphQLTypes.js';
import {
  GetSubscribersResponse,
  SubscribeParams,
  Subscriber,
} from '../types/index.js';
import { SubgraphConsumer } from '../types/internalTypes.js';
import { getSubscribersQuery } from './subgraph/getSubscribersQuery.js';

export const getSubscribers = async ({
  graphQLClient = throwIfMissing(),
  collectionTokenId,
}: SubscribeParams & SubgraphConsumer): Promise<GetSubscribersResponse> => {
  const vCollectionTokenId = positiveNumberSchema()
    .required()
    .label('collectionTokenId')
    .validateSync(collectionTokenId);

  const getSubscribersQueryResponse: GetCollectionSubscribersGraphQLResponse =
    await getSubscribersQuery({
      graphQLClient,
      collectionTokenId: vCollectionTokenId,
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
