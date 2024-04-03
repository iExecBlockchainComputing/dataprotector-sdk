import { gql } from 'graphql-request';
import { toHex } from '../../../utils/data.js';
import { GetCollectionSubscribersGraphQLResponse } from '../../types/graphQLTypes.js';
import { GetCollectionSubscriptionsParams } from '../../types/index.js';
import { SubgraphConsumer } from '../../types/internalTypes.js';

export const getCollectionSubscriptionsQuery = async ({
  graphQLClient,
  subscriberAddress,
  collectionTokenId,
  includePastSubscriptions,
}: SubgraphConsumer &
  GetCollectionSubscriptionsParams): Promise<GetCollectionSubscribersGraphQLResponse> => {
  const collectionSubscriptionsQuery = gql`
    query ($where: CollectionSubscription_filter) {
      collectionSubscriptions(where: $where) {
        id
        collection {
          id
          owner {
            id
          }
          subscriptionParams {
            price
            duration
          }
        }
        subscriber {
          id
        }
        creationTimestamp
        endDate
      }
    }
  `;

  const variables = {
    where: {
      subscriber: subscriberAddress || undefined,
      collection: collectionTokenId ? toHex(collectionTokenId) : undefined,
      endDate_gte: includePastSubscriptions
        ? undefined
        : Math.floor(new Date().getTime() / 1000),
    },
  };

  return graphQLClient.request<GetCollectionSubscribersGraphQLResponse>(
    collectionSubscriptionsQuery,
    variables
  );
};
