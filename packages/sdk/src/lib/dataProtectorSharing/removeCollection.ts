import { ErrorWithData, WorkflowError } from '../../utils/errors.js';
import {
  positiveNumberSchema,
  throwIfMissing,
} from '../../utils/validators.js';
import {
  IExecConsumer,
  RemoveCollectionParams,
  SharingContractConsumer,
  SuccessWithTransactionHash,
} from '../types/index.js';
import { getSharingContract } from './smartContract/getSharingContract.js';
import { onlyCollectionOperator } from './smartContract/preflightChecks.js';
import { getCollectionDetails } from './smartContract/sharingContract.reads.js';

export const removeCollection = async ({
  iexec = throwIfMissing(),
  sharingContractAddress = throwIfMissing(),
  collectionTokenId = throwIfMissing(),
}: IExecConsumer &
  SharingContractConsumer &
  RemoveCollectionParams): Promise<SuccessWithTransactionHash> => {
  const vCollectionTokenId = positiveNumberSchema()
    .required()
    .label('collectionTokenId')
    .validateSync(collectionTokenId);

  let userAddress = await iexec.wallet.getAddress();
  userAddress = userAddress.toLowerCase();

  const sharingContract = await getSharingContract(
    iexec,
    sharingContractAddress
  );

  await onlyCollectionOperator({
    sharingContract,
    collectionTokenId: vCollectionTokenId,
    userAddress,
  });

  try {
    const collectionDetails = await getCollectionDetails({
      sharingContract,
      collectionTokenId: vCollectionTokenId,
    });
    if (!collectionDetails) {
      // Should never happen because we checked earlier with `onlyCollectionOperator()` that the collection existed
      throw new ErrorWithData(
        'This collection does not seem to exist or it has been burned.',
        {
          collectionTokenId,
        }
      );
    }

    if (collectionDetails.collectionSize > 0) {
      throw new ErrorWithData(
        'Collection still has protected data. Please empty the collection first by calling removeFromCollection for each protected data.',
        {
          collectionTokenId,
          currentCollectionSize: collectionDetails.collectionSize,
        }
      );
    }

    const tx = await sharingContract.removeCollection(vCollectionTokenId);
    await tx.wait();

    return {
      success: true,
      txHash: tx.hash,
    };
  } catch (e) {
    throw new WorkflowError(
      'Failed to remove collection',
      e as Error | undefined
    );
  }
};
