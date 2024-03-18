import { gql } from 'graphql-request';
import { GetSubscribersParams } from '../../../index.js';
import { toHex } from '../../../utils/data.js';
import { GetCollectionSubscribersGraphQLResponse } from '../../types/graphQLTypes.js';
import { SubgraphConsumer } from '../../types/internalTypes.js';

export const getCollectionSubscribers = async ({
  graphQLClient,
  collectionTokenId,
}: GetSubscribersParams &
  SubgraphConsumer): Promise<GetCollectionSubscribersGraphQLResponse> => {
  const getSubscribersQuery = gql`
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
    await graphQLClient.request(getSubscribersQuery, variables);
  return getSubscribersQueryResponse;
};
