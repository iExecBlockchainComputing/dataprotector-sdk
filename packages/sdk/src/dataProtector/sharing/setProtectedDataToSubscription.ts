import { WorkflowError } from '../../utils/errors.js';
import { throwIfMissing } from '../../utils/validators.js';
import { AddressOrENS, SuccessWithTransactionHash } from '../types/shared.js';
import { getSharingContract } from './smartContract/getSharingContract.js';

export type SetProtectedDataToSubscriptionParams = {
  collectionTokenId: number;
  protectedDataAddress: AddressOrENS;
};

export const setProtectedDataToSubscription = async ({
  collectionTokenId = throwIfMissing(),
  protectedDataAddress = throwIfMissing(),
}: SetProtectedDataToSubscriptionParams): Promise<SuccessWithTransactionHash> => {
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
