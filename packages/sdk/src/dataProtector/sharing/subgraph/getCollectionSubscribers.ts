import { gql } from 'graphql-request';
import { toHex } from '../../../utils/data.js';
import {
  GraphQLResponseSubscribers,
  SubgraphConsumer,
  SubscribeParams,
} from '../../types.js';

export const getCollectionSubscribers = async ({
  graphQLClient,
  collectionId,
}: SubscribeParams & SubgraphConsumer): Promise<GraphQLResponseSubscribers> => {
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
    collection: toHex(collectionId),
  };
  const getSubscribersQueryResponse: GraphQLResponseSubscribers =
    await graphQLClient.request(getSubscribersQuery, variables);
  return getSubscribersQueryResponse;
};
