import { gql } from 'graphql-request';
import { toHex } from '../../../utils/data.js';
import { GetCollectionSubscribersGraphQLResponse } from '../../types/graphQLTypes.js';
import { SubscribeParams } from '../../types/index.js';
import { SubgraphConsumer } from '../../types/internalTypes.js';

export const getSubscribersQuery = async ({
  graphQLClient,
  collectionTokenId,
}: SubscribeParams &
  SubgraphConsumer): Promise<GetCollectionSubscribersGraphQLResponse> => {
  const subscribers = gql`
    query Subscribers($collection: String!) {
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
  const getSubscribersQueryResponse: GetCollectionSubscribersGraphQLResponse =
    await graphQLClient.request(subscribers, variables);
  return getSubscribersQueryResponse;
};
