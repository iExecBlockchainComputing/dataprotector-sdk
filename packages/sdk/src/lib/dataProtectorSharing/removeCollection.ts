import { WorkflowError } from '../../utils/errors.js';
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
import {
  onlyCollectionEmpty,
  onlyCollectionOperator,
} from './smartContract/preflightChecks.js';
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

  //---------- Smart Contract Call ----------
  const collectionDetails = await getCollectionDetails({
    sharingContract,
    collectionTokenId: collectionTokenId,
  });
  await onlyCollectionOperator({
    sharingContract,
    collectionTokenId: vCollectionTokenId,
    userAddress,
  });

  //---------- Pre flight check ----------
  onlyCollectionEmpty(collectionDetails);

  try {
    const tx = await sharingContract.removeCollection(vCollectionTokenId);
    await tx.wait();

    return {
      success: true,
      txHash: tx.hash,
    };
  } catch (e) {
    throw new WorkflowError('Failed to remove collection', e);
  }
};
