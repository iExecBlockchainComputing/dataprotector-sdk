import { GraphQLClient } from 'graphql-request';
import { toHex } from '../../utils/data.js';
import { ErrorWithData, WorkflowError } from '../../utils/errors.js';
import {
  positiveNumberSchema,
  throwIfMissing,
} from '../../utils/validators.js';
import {
  SubgraphConsumer,
  SubscribeParams,
  SuccessWithTransactionHash,
} from '../types/index.js';
import { getSharingContract } from './smartContract/getSharingContract.js';
import { getCollectionById } from './subgraph/getCollectionById.js';

export const subscribe = async ({
  graphQLClient = throwIfMissing(),
  collectionTokenId,
}: SubgraphConsumer & SubscribeParams): Promise<SuccessWithTransactionHash> => {
  const vCollectionTokenId = positiveNumberSchema()
    .required()
    .label('collectionTokenId')
    .validateSync(collectionTokenId);

  const collection = await checkAndGetCollection({
    graphQLClient,
    collectionTokenId: vCollectionTokenId,
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
  graphQLClient,
  collectionTokenId,
}: {
  graphQLClient: GraphQLClient;
  collectionTokenId: number;
}) {
  const collection = await getCollectionById({
    graphQLClient,
    collectionTokenId: toHex(collectionTokenId),
  });

  if (collection?.subscriptionParams?.duration === 0) {
    throw new ErrorWithData('This collection have no subscription parameters', {
      collectionTokenId,
      currentCollectionOwnerAddress: collection.owner?.id,
    });
  }

  return collection;
}
