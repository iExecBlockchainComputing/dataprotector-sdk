import { GraphQLClient } from 'graphql-request';
import { ErrorWithData, WorkflowError } from '../../utils/errors.js';
import {
  positiveNumberSchema,
  throwIfMissing,
} from '../../utils/validators.js';
import {
  IExecConsumer,
  RemoveCollectionParams,
  SuccessWithTransactionHash,
  SubgraphConsumer,
  Address,
} from '../types/index.js';
import { getSharingContract } from './smartContract/getSharingContract.js';
import { getCollectionById } from './subgraph/getCollectionById.js';

export const removeCollection = async ({
  iexec = throwIfMissing(),
  graphQLClient = throwIfMissing(),
  collectionTokenId = throwIfMissing(),
}: IExecConsumer &
  SubgraphConsumer &
  RemoveCollectionParams): Promise<SuccessWithTransactionHash> => {
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

  const sharingContract = await getSharingContract();
  try {
    const tx = await sharingContract.removeCollection(collection.id);
    await tx.wait();
    return {
      success: true,
      txHash: tx.hash,
    };
  } catch (e) {
    throw new WorkflowError('Failed to Remove Protected Data From Renting', e);
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
    collectionTokenId,
  });

  if (collection.owner?.id !== userAddress) {
    throw new ErrorWithData('This collection is not owned by the user.', {
      collectionTokenId,
      currentCollectionOwnerAddress: collection.owner?.id,
    });
  }

  if (collection.protectedDatas.length > 0) {
    throw new ErrorWithData("Collection has protectedData. It's not empty", {
      collectionTokenId,
      currentCollectionSize: collection.protectedDatas.length,
    });
  }
  return collection;
}
