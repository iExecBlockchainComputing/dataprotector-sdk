import { gql } from 'graphql-request';
import { toHex } from '../../../utils/data.js';
import { GetCollectionSubscribersGraphQLResponse } from '../../types/graphQLTypes.js';
import { GetCollectionSubscriptionsParams } from '../../types/index.js';
import { SubgraphConsumer } from '../../types/internalTypes.js';

export const getCollectionSubscriptionsQuery = async ({
  graphQLClient,
  collectionTokenId,
}: SubgraphConsumer &
  GetCollectionSubscriptionsParams): Promise<GetCollectionSubscribersGraphQLResponse> => {
  const collectionSubscriptions = gql`
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
  const getCollectionSubscriptionsQueryResponse: GetCollectionSubscribersGraphQLResponse =
    await graphQLClient.request(collectionSubscriptions, variables);
  return getCollectionSubscriptionsQueryResponse;
};
