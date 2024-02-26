import { ErrorWithData, WorkflowError } from '../../utils/errors.js';
import {
  positiveNumberSchema,
  throwIfMissing,
} from '../../utils/validators.js';
import {
  IExecConsumer,
  SharingContractConsumer,
  SubscribeParams,
  SuccessWithTransactionHash,
} from '../types/index.js';
import { getSharingContract } from './smartContract/getSharingContract.js';
import { getSubscriptionParams } from './smartContract/getterForSharingContract.js';

export const subscribe = async ({
  iexec = throwIfMissing(),
  sharingContractAddress = throwIfMissing(),
  collectionTokenId,
}: IExecConsumer &
  SharingContractConsumer &
  SubscribeParams): Promise<SuccessWithTransactionHash> => {
  const vCollectionTokenId = positiveNumberSchema()
    .required()
    .label('collectionTokenId')
    .validateSync(collectionTokenId);

  const sharingContract = await getSharingContract(
    iexec,
    sharingContractAddress
  );

  const subscriptionsParams = await getSubscriptionParams({
    sharingContract,
    collectionTokenId: vCollectionTokenId,
  });

  if (subscriptionsParams.duration === 0) {
    throw new ErrorWithData(
      'This collection has no valid subscription params.',
      {
        collectionTokenId,
      }
    );
  }

  try {
    const tx = await sharingContract.subscribeTo(vCollectionTokenId, {
      value: subscriptionsParams.price,
    });
    await tx.wait();

    return {
      success: true,
      txHash: tx.hash,
    };
  } catch (e) {
    throw new WorkflowError(
      'Sharing smart contract: Failed to subscribe to collection',
      e
    );
  }
};
