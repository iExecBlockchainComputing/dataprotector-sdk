import { WorkflowError } from '../../utils/errors.js';
import { throwIfMissing } from '../../utils/validators.js';
import {
  SetProtectedDataAsRentableParams,
  SetProtectedDataAsRentableResponse,
} from '../types.js';
import { getSharingContract } from './smartContract/getSharingContract.js';

export const setProtectedDataToRenting = async ({
  collectionTokenId = throwIfMissing(),
  protectedDataAddress = throwIfMissing(),
  priceInNRLC = throwIfMissing(),
  durationInSeconds = throwIfMissing(),
}: SetProtectedDataAsRentableParams): Promise<SetProtectedDataAsRentableResponse> => {
  //TODO:Input validation

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
    throw new WorkflowError(
      'Failed to set Subscription Options into sharing smart contract',
      e
    );
  }
};
