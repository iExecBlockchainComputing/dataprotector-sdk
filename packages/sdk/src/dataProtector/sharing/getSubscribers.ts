import { gql } from 'graphql-request';
import {
  positiveNumberSchema,
  throwIfMissing,
} from '../../utils/validators.js';
import {
  GraphQLResponse,
  SubgraphConsumer,
  SubscribeParams,
} from '../types.js';

export const getSubscribers = async ({
  graphQLClient = throwIfMissing(),
  collectionId,
}: SubscribeParams & SubgraphConsumer): Promise<any> => {
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
    collection: '0x' + vCollectionId.toString(16),
  };
  const getSubscribersQueryResponse: GraphQLResponse =
    await graphQLClient.request(getSubscribersQuery, variables);
  return getSubscribersQueryResponse;
};
