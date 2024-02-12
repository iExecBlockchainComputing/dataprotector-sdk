import {
  positiveNumberSchema,
  throwIfMissing,
} from '../../utils/validators.js';
import {
  Address,
  CollectionTokenIdParam,
  SubgraphConsumer,
} from '../types/shared.js';
import { getCollectionSubscribers } from './subgraph/getCollectionSubscribers.js';

type Subscriber = {
  address: Address;
  endSubscriptionTimestamp: number;
};

export type GetSubscribersResponse = {
  subscribers: Subscriber[];
};

export const getSubscribers = async ({
  graphQLClient = throwIfMissing(),
  collectionTokenId,
}: SubgraphConsumer &
  CollectionTokenIdParam): Promise<GetSubscribersResponse> => {
  const vCollectionId = positiveNumberSchema()
    .required()
    .label('collectionId')
    .validateSync(collectionTokenId);
  const getSubscribersQueryResponse = await getCollectionSubscribers({
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
