import { WorkflowError } from '../../utils/errors.js';
import { positiveNumberSchema } from '../../utils/validators.js';
import { SubscribeParams, SuccessWithTransactionHash } from '../types/index.js';
import { getSharingContract } from './smartContract/getSharingContract.js';

export const subscribe = async ({
  collectionTokenId,
}: SubscribeParams): Promise<SuccessWithTransactionHash> => {
  try {
    const vCollectionTokenId = positiveNumberSchema()
      .required()
      .label('collectionTokenId')
      .validateSync(collectionTokenId);

    const sharingContract = await getSharingContract();
    const subscriptionParams = await sharingContract.subscriptionParams(
      vCollectionTokenId
    );
    const price = subscriptionParams.price;
    const tx = await sharingContract.subscribeTo(vCollectionTokenId, {
      value: price,
      // TODO: See how we can remove this
      gasLimit: 900_000,
    });
    const txReceipt = await tx.wait();
    return {
      success: true,
      txHash: txReceipt.hash,
    };
  } catch (e) {
    throw new WorkflowError(
      'Sharing smart contract: Failed to subscribe to collection',
      e
    );
  }
};
