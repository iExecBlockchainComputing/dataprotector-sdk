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
import { onlyCollectionNotMine } from './smartContract/preflightChecks.js';
import { getCollectionDetails } from './smartContract/sharingContract.reads.js';

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

  let userAddress = await iexec.wallet.getAddress();
  userAddress = userAddress.toLowerCase();
  const sharingContract = await getSharingContract(
    iexec,
    sharingContractAddress
  );

  await onlyCollectionNotMine({
    sharingContract,
    collectionTokenId,
    userAddress,
  });

  const collectionDetails = await getCollectionDetails({
    sharingContract,
    collectionTokenId: vCollectionTokenId,
  });

  if (!collectionDetails?.subscriptionParams) {
    throw new ErrorWithData(
      'This collection has no valid subscription params.',
      {
        collectionTokenId,
      }
    );
  }

  try {
    const tx = await sharingContract.subscribeTo(vCollectionTokenId, {
      value: collectionDetails.subscriptionParams.priceInNRLC,
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
