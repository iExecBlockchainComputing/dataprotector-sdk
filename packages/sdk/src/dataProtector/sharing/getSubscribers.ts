import { gql } from 'graphql-request';
import { toHex } from '../../utils/data.js';
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
export const getSubscribers = async ({
  graphQLClient = throwIfMissing(),
  collectionId,
}: SubscribeParams & SubgraphConsumer): Promise<GetSubscribersResponse> => {
  const vCollectionId = positiveNumberSchema()
    .required()
    .label('collectionId')
    .validateSync(collectionId);
  const getSubscribersQuery = gql`
    query ($collection: String!) {
      collectionSubscriptions(where: { collection: $collection }) {
        subscriber {
          id
        }
        endDate
      }
    }
  `;
  //in case of large subscribers number we need to paginate response
  const variables = {
    collection: toHex(vCollectionId),
  };
  const getSubscribersQueryResponse: GraphQLResponseSubscribers =
    await graphQLClient.request(getSubscribersQuery, variables);

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
