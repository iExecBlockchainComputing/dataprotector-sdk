import { WorkflowError } from '../../utils/errors.js';
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
import {
  onlyCollectionAvailableForSubscription,
  onlyCollectionNotMine,
} from './smartContract/preflightChecks.js';
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

  //---------- Smart Contract Call ----------
  const collectionDetails = await getCollectionDetails({
    sharingContract,
    collectionTokenId: vCollectionTokenId,
  });

  //---------- Pre flight check ----------
  onlyCollectionNotMine({
    collectionOwner: collectionDetails.collectionOwner,
    userAddress,
  });
  onlyCollectionAvailableForSubscription(collectionDetails);

  try {
    const tx = await sharingContract.subscribeTo(vCollectionTokenId, {
      value: collectionDetails.subscriptionParams.price,
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
