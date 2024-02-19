import { GraphQLClient } from 'graphql-request';
import { toHex } from '../../utils/data.js';
import { ErrorWithData, WorkflowError } from '../../utils/errors.js';
import {
  positiveNumberSchema,
  throwIfMissing,
} from '../../utils/validators.js';
import {
  Address,
  IExecConsumer,
  SubgraphConsumer,
  SubscribeParams,
  SuccessWithTransactionHash,
} from '../types/index.js';
import { getSharingContract } from './smartContract/getSharingContract.js';
import { getCollectionById } from './subgraph/getCollectionById.js';

export const subscribe = async ({
  iexec = throwIfMissing(),
  graphQLClient = throwIfMissing(),
  collectionTokenId,
}: IExecConsumer &
  SubgraphConsumer &
  SubscribeParams): Promise<SuccessWithTransactionHash> => {
  const vCollectionTokenId = positiveNumberSchema()
    .required()
    .label('collectionTokenId')
    .validateSync(collectionTokenId);

  const userAddress = (await iexec.wallet.getAddress()).toLowerCase();
  const collection = await checkAndGetCollection({
    graphQLClient,
    collectionTokenId: vCollectionTokenId,
    userAddress,
  });

  try {
    const sharingContract = await getSharingContract();
    const tx = await sharingContract.subscribeTo(vCollectionTokenId, {
      value: collection.subscriptionParams?.price,
      // TODO: See how we can remove this
      gasLimit: 900_000,
    });
    await tx.wait();
    return {
      success: true,
      txHash: tx.hash,
    };
  } catch (e) {
    throw new WorkflowError(
      'Sharing smart contract: Failed to subscribe to collection',
      e
    );
  }
};

async function checkAndGetCollection({
  userAddress,
  graphQLClient,
  collectionTokenId,
}: {
  graphQLClient: GraphQLClient;
  collectionTokenId: number;
  userAddress: Address;
}) {
  const collection = await getCollectionById({
    graphQLClient,
    collectionTokenId: toHex(collectionTokenId),
  });

  if (!collection) {
    throw new ErrorWithData('This collection does not exist in the subgraph.', {
      collection,
    });
  }

  const isNotAnyMoreAvailableForSubscription =
    collection?.subscriptionParams?.duration === 0;
  if (!collection?.subscriptionParams || isNotAnyMoreAvailableForSubscription) {
    throw new ErrorWithData(
      'This collection has no subscription parameters (price and duration).',
      {
        collectionTokenId,
        currentCollectionOwnerAddress: collection.owner?.id,
      }
    );
  }

  // TODO: remove & set somewhere else
  const hasActiveSubscriptions = collection.subscriptions.some(
    (subscription) => subscription.subscriber.id === userAddress
  );
  if (hasActiveSubscriptions) {
    throw new ErrorWithData('This collection has already valid subscription', {
      collectionTokenId,
      currentCollectionOwnerAddress: collection.owner?.id,
    });
  }

  return collection;
}
