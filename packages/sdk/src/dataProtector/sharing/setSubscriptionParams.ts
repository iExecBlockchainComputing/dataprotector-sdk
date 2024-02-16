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
  SetSubscriptionParams,
  SubgraphConsumer,
  SuccessWithTransactionHash,
} from '../types/index.js';
import { getSharingContract } from './smartContract/getSharingContract.js';
import { getCollectionById } from './subgraph/getCollectionById.js';

export const setSubscriptionParams = async ({
  iexec = throwIfMissing(),
  graphQLClient = throwIfMissing(),
  collectionTokenId = throwIfMissing(),
  priceInNRLC = throwIfMissing(),
  durationInSeconds = throwIfMissing(),
}: IExecConsumer &
  SubgraphConsumer &
  SetSubscriptionParams): Promise<SuccessWithTransactionHash> => {
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
    const tx = await sharingContract.setSubscriptionParams(collection.id, [
      priceInNRLC.toLocaleString(),
      durationInSeconds,
    ]);
    await tx.wait();

    return {
      success: true,
      txHash: tx.hash,
    };
  } catch (e) {
    throw new WorkflowError(
      'Failed to set Subscription Options into sharing smart contract',
      e
    );
  }
};

async function checkAndGetCollection({
  graphQLClient,
  collectionTokenId,
  userAddress,
}: {
  graphQLClient: GraphQLClient;
  collectionTokenId: number;
  userAddress: Address;
}) {
  const collection = await getCollectionById({
    graphQLClient,
    collectionTokenId: toHex(collectionTokenId),
  });

  if (collection.owner?.id !== userAddress) {
    throw new ErrorWithData('This collection is not owned by the user.', {
      collectionTokenId,
      currentCollectionOwnerAddress: collection.owner?.id,
    });
  }

  return collection;
}
