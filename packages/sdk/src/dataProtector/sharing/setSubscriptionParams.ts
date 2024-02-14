import { WorkflowError } from '../../utils/errors.js';
import { throwIfMissing } from '../../utils/validators.js';
import {
  SetSubscriptionParams,
  SuccessWithTransactionHash,
} from '../types/index.js';
import { getSharingContract } from './smartContract/getSharingContract.js';

export const setSubscriptionParams = async ({
  collectionTokenId = throwIfMissing(),
  priceInNRLC = throwIfMissing(),
  durationInSeconds = throwIfMissing(),
}: SetSubscriptionParams): Promise<SuccessWithTransactionHash> => {
  try {
    //TODO:Input validation
    const sharingContract = await getSharingContract();

    const tx = await sharingContract.setSubscriptionParams(collectionTokenId, [
      priceInNRLC.toLocaleString(),
      durationInSeconds,
    ]);
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
