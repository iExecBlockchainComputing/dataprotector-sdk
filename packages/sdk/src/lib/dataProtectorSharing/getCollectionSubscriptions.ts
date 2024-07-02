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
  collectionId,
  includePastSubscriptions = false,
}: SubgraphConsumer &
  GetCollectionSubscriptionsParams): Promise<GetCollectionSubscriptionsResponse> => {
  const vSubscriberAddress = addressSchema()
    .label('subscriberAddress')
    .validateSync(subscriberAddress);

  const vCollectionId = positiveNumberSchema()
    .label('collectionId')
    .validateSync(collectionId);

  const vIncludePastSubscriptions = booleanSchema()
    .label('includePastSubscriptions')
    .validateSync(includePastSubscriptions);

  try {
    return await getCollectionSubscriptionsQuery({
      graphQLClient,
      subscriberAddress: vSubscriberAddress,
      collectionId: vCollectionId,
      includePastSubscriptions: vIncludePastSubscriptions,
    });
  } catch (e) {
    throw new WorkflowError({
      message: 'Failed to get collection subscriptions',
      errorCause: e,
    });
  }
};
