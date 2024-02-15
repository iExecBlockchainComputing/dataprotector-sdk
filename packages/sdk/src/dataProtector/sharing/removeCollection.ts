import { WorkflowError } from '../../utils/errors.js';
import { throwIfMissing } from '../../utils/validators.js';
import {
  IExecConsumer,
  RemoveCollectionParams,
  SuccessWithTransactionHash,
  SubgraphConsumer,
} from '../types/index.js';
import { getSharingContract } from './smartContract/getSharingContract.js';
import {
  collectionExists,
  isCollectionOwner,
  isProtectedDataInCollection,
} from './utils.js';

export const removeCollection = async ({
  iexec = throwIfMissing(),
  graphQLClient = throwIfMissing(),
  collectionTokenId = throwIfMissing(),
}: IExecConsumer &
  SubgraphConsumer &
  RemoveCollectionParams): Promise<SuccessWithTransactionHash> => {
  //TODO:Input validation
  const collectionExist = await collectionExists({
    graphQLClient,
    collectionTokenId: collectionTokenId,
  });
  if (!collectionExist) {
    throw new WorkflowError(
      'Failed to Remove Protected Data From Renting: collection does not exist.'
    );
  }

  const userAddress = await iexec.wallet.getAddress();

  const userIsCollectionOwner = await isCollectionOwner({
    graphQLClient,
    collectionTokenId: collectionTokenId,
    walletAddress: userAddress,
  });
  if (!userIsCollectionOwner) {
    throw new WorkflowError(
      'Failed to Remove Protected Data From Renting: user is not collection owner.'
    );
  }
  //TODO : Add verifiers

  const sharingContract = await getSharingContract();
  try {
    const tx = await sharingContract.removeCollection(collectionTokenId);
    const txReceipt = await tx.wait();
    return {
      success: true,
      txHash: txReceipt.hash,
    };
  } catch (e) {
    throw new WorkflowError('Failed to Remove Protected Data From Renting', e);
  }
};
