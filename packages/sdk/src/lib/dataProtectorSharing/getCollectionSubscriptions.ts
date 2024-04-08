import { WorkflowError } from '../../utils/errors.js';
import {
  addressSchema,
  booleanSchema,
  positiveNumberSchema,
  throwIfMissing,
} from '../../utils/validators.js';
import {
  GetCollectionSubscriptionsResponse,
  GetCollectionSubscriptionsParams,
} from '../types/index.js';
import { SubgraphConsumer } from '../types/internalTypes.js';
import { getCollectionSubscriptionsQuery } from './subgraph/getCollectionSubscriptionsQuery.js';

export const getCollectionSubscriptions = async ({
  graphQLClient = throwIfMissing(),
  subscriberAddress,
  collectionTokenId,
  includePastSubscriptions = false,
}: SubgraphConsumer &
  GetCollectionSubscriptionsParams): Promise<GetCollectionSubscriptionsResponse> => {
  const vSubscriberAddress = addressSchema()
    .label('subscriberAddress')
    .validateSync(subscriberAddress);

  const vCollectionTokenId = positiveNumberSchema()
    .label('collectionTokenId')
    .validateSync(collectionTokenId);

  const vIncludePastSubscriptions = booleanSchema()
    .label('includePastSubscriptions')
    .validateSync(includePastSubscriptions);

  try {
    return await getCollectionSubscriptionsQuery({
      graphQLClient,
      subscriberAddress: vSubscriberAddress,
      collectionTokenId: vCollectionTokenId,
      includePastSubscriptions: vIncludePastSubscriptions,
    });
  } catch (e) {
    throw new WorkflowError('Failed to get collection subscriptions', e);
  }
};
