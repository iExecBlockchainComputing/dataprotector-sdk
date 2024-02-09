import { WorkflowError } from '../../utils/errors.js';
import { throwIfMissing } from '../../utils/validators.js';
import {
  SetProtectedDataToSubscriptionParams,
  SetProtectedDataToSubscriptionResponse,
} from '../types.js';
import { getSharingContract } from './smartContract/getSharingContract.js';

export const setProtectedDataToSubscription = async ({
  collectionTokenId = throwIfMissing(),
  protectedDataAddress = throwIfMissing(),
}: SetProtectedDataToSubscriptionParams): Promise<SetProtectedDataToSubscriptionResponse> => {
  try {
    //TODO:Input validation
    const sharingContract = await getSharingContract();

    const tx = await sharingContract.setProtectedDataToSubscription(
      collectionTokenId,
      protectedDataAddress
    );
    await tx.wait();

    return {
      success: true,
      transaction: tx,
    };
  } catch (e) {
    throw new WorkflowError(
      'Failed to set ProtectedData To Subscription into sharing smart contract',
      e
    );
  }
};
