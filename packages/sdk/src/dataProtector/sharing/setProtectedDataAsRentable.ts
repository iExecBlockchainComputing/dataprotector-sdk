import { WorkflowError } from '../../utils/errors.js';
import { isCollectionOwner } from '../../utils/sharing.js';
import { throwIfMissing } from '../../utils/validators.js';
import {
  IExecConsumer,
  SetProtectedDataAsRentableParams,
  SetProtectedDataAsRentableResponse,
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
  SetProtectedDataAsRentableParams): Promise<SetProtectedDataAsRentableResponse> => {
  //TODO:Input validation
  const userAddress = await iexec.wallet.getAddress();
  if (
    !(await isCollectionOwner({
      graphQLClient,
      collectionId: collectionTokenId,
      walletAddress: userAddress,
    }))
  ) {
    throw new WorkflowError(
      'Failed to Set Protected Data To Renting: user is not collection owner.'
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
