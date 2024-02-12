import { WorkflowError } from '../../utils/errors.js';
import {
  isCollectionOwner,
  isProtectedDataInCollection,
} from '../../utils/sharing.js';
import { throwIfMissing } from '../../utils/validators.js';
import {
  IExecConsumer,
  SetProtectedDataToRentingParams,
  SetProtectedDataToRentingResponse,
  SubgraphConsumer,
} from '../types.js';
import { getSharingContract } from './smartContract/getSharingContract.js';

export const setProtectedDataToRenting = async ({
  iexec = throwIfMissing(),
  graphQLClient = throwIfMissing(),
  collectionTokenId = throwIfMissing(),
  protectedDataAddress = throwIfMissing(),
  priceInNRLC = throwIfMissing(),
  durationInSeconds = throwIfMissing(),
}: IExecConsumer &
  SubgraphConsumer &
  SetProtectedDataToRentingParams): Promise<SetProtectedDataToRentingResponse> => {
  //TODO:Input validation
  const userAddress = await iexec.wallet.getAddress();
  if (
    !(await isCollectionOwner({
      graphQLClient,
      collectionTokenId: collectionTokenId,
      walletAddress: userAddress,
    }))
  ) {
    throw new WorkflowError(
      'Failed to Set Protected Data To Renting: user is not collection owner.'
    );
  }
  if (
    !(await isProtectedDataInCollection({
      graphQLClient,
      protectedDataAddress,
      collectionTokenId: collectionTokenId,
    }))
  ) {
    throw new WorkflowError(
      'Failed to Set Protected Data To Renting: Protected Data is not in collection.'
    );
  }
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
