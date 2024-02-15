import { WorkflowError } from '../../utils/errors.js';
import { throwIfMissing } from '../../utils/validators.js';
import {
  IExecConsumer,
  SetProtectedDataToRentingParams,
  SuccessWithTransactionHash,
  SubgraphConsumer,
} from '../types/index.js';
import { getSharingContract } from './smartContract/getSharingContract.js';
import {
  collectionExists,
  isCollectionOwner,
  isProtectedDataInCollection,
} from './utils.js';

export const setProtectedDataToRenting = async ({
  iexec = throwIfMissing(),
  graphQLClient = throwIfMissing(),
  collectionTokenId = throwIfMissing(),
  protectedDataAddress = throwIfMissing(),
  priceInNRLC = throwIfMissing(),
  durationInSeconds = throwIfMissing(),
}: IExecConsumer &
  SubgraphConsumer &
  SetProtectedDataToRentingParams): Promise<SuccessWithTransactionHash> => {
  //TODO:Input validation

  const collectionExist = await collectionExists({
    graphQLClient,
    collectionTokenId: collectionTokenId,
  });
  if (!collectionExist) {
    throw new WorkflowError(
      'Failed to Set Protected Data To Renting: collection does not exist.'
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
      'Failed to Set Protected Data To Renting: user is not collection owner.'
    );
  }

  const ProtectedDataInCollection = await isProtectedDataInCollection({
    graphQLClient,
    protectedDataAddress,
    collectionTokenId: collectionTokenId,
  });
  if (!ProtectedDataInCollection) {
    throw new WorkflowError(
      'Failed to Set Protected Data To Renting: Protected Data is not in collection.'
    );
  }

  // TODO
  // if (
  //   !(await isProtectedDataNotForSale({
  //     graphQLClient,
  //     protectedDataAddress,
  //     collectionTokenId: collectionTokenId,
  //   }))
  // ) {
  //   throw new WorkflowError(
  //     'Failed to Set Protected Data To Renting: Protected Data is already available for sale'
  //   );
  // }

  const sharingContract = await getSharingContract();
  try {
    const tx = await sharingContract.setProtectedDataToRenting(
      collectionTokenId,
      protectedDataAddress,
      priceInNRLC,
      durationInSeconds
    );
    const txReceipt = await tx.wait();
    return {
      success: true,
      txHash: txReceipt.hash,
    };
  } catch (e) {
    throw new WorkflowError('Failed to Set Protected Data To Renting', e);
  }
};
