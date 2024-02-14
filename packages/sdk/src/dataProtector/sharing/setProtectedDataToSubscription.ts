import { WorkflowError } from '../../utils/errors.js';
import { throwIfMissing } from '../../utils/validators.js';
import {
  SetProtectedDataToSubscriptionParams,
  SetProtectedDataToSubscriptionResponse,
} from '../types/index.js';
import { getSharingContract } from './smartContract/getSharingContract.js';

export const setProtectedDataToSubscription = async ({
  collectionTokenId = throwIfMissing(),
  protectedDataAddress = throwIfMissing(),
}: SetProtectedDataToSubscriptionParams): Promise<SetProtectedDataToSubscriptionResponse> => {
  try {
    //TODO:Input validation

    // Check that the protected data exists
    // Check that the protected data is owned by the Sharing smart-contract
    // Check that the protected data is in a collection owned by the user

    // Check that the collection exists
    // Check that the collection is owned by the user

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
