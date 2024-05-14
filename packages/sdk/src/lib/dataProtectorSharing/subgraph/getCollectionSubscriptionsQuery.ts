import { gql } from 'graphql-request';
import { toHex } from '../../../utils/data.js';
import { GetCollectionSubscriptionsGraphQLResponse } from '../../types/graphQLTypes.js';
import { GetCollectionSubscriptionsParams } from '../../types/index.js';
import { SubgraphConsumer } from '../../types/internalTypes.js';

export const getCollectionSubscriptionsQuery = async ({
  graphQLClient,
  subscriberAddress,
  collectionId,
  includePastSubscriptions,
}: SubgraphConsumer &
  GetCollectionSubscriptionsParams): Promise<GetCollectionSubscriptionsGraphQLResponse> => {
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
      collection: collectionId ? toHex(collectionId) : undefined,
      endDate_gte: includePastSubscriptions
        ? undefined
        : Math.floor(new Date().getTime() / 1000),
    },
  };

  return graphQLClient.request<GetCollectionSubscriptionsGraphQLResponse>(
    collectionSubscriptionsQuery,
    variables
  );
};
