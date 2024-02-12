import { gql } from 'graphql-request';
import { toHex } from '../../../utils/data.js';
import {
  SubgraphConsumer,
  CollectionTokenIdParam,
} from '../../types/shared.js';

type CollectionSubscription = {
  subscriber: {
    id: string;
  };
  endDate: string;
};

type GraphQLResponseSubscribers = {
  collectionSubscriptions: CollectionSubscription[];
};

export const getCollectionSubscribers = async ({
  graphQLClient,
  collectionTokenId,
}: SubgraphConsumer &
  CollectionTokenIdParam): Promise<GraphQLResponseSubscribers> => {
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
    collection: toHex(collectionTokenId),
  };
  const getSubscribersQueryResponse: GraphQLResponseSubscribers =
    await graphQLClient.request(getSubscribersQuery, variables);
  return getSubscribersQueryResponse;
};
