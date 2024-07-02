import { WorkflowError } from '../../utils/errors.js';
import {
  positiveNumberSchema,
  throwIfMissing,
} from '../../utils/validators.js';
import {
  RemoveCollectionParams,
  SharingContractConsumer,
  SuccessWithTransactionHash,
} from '../types/index.js';
import { IExecConsumer } from '../types/internalTypes.js';
import { getSharingContract } from './smartContract/getSharingContract.js';
import {
  onlyCollectionEmpty,
  onlyCollectionOperator,
} from './smartContract/preflightChecks.js';
import { getCollectionDetails } from './smartContract/sharingContract.reads.js';

export const removeCollection = async ({
  iexec = throwIfMissing(),
  sharingContractAddress = throwIfMissing(),
  collectionId = throwIfMissing(),
}: IExecConsumer &
  SharingContractConsumer &
  RemoveCollectionParams): Promise<SuccessWithTransactionHash> => {
  const vCollectionId = positiveNumberSchema()
    .required()
    .label('collectionId')
    .validateSync(collectionId);

  let userAddress = await iexec.wallet.getAddress();
  userAddress = userAddress.toLowerCase();

  const sharingContract = await getSharingContract(
    iexec,
    sharingContractAddress
  );

  //---------- Smart Contract Call ----------
  const collectionDetails = await getCollectionDetails({
    sharingContract,
    collectionId: vCollectionId,
  });
  await onlyCollectionOperator({
    sharingContract,
    collectionId: vCollectionId,
    userAddress,
  });

  //---------- Pre flight check ----------
  onlyCollectionEmpty(collectionDetails);

  try {
    const { txOptions } = await iexec.config.resolveContractsClient();
    const tx = await sharingContract.burn(vCollectionId, txOptions);
    await tx.wait();

    return {
      txHash: tx.hash,
    };
  } catch (e) {
    throw new WorkflowError({
      message: 'Failed to remove collection',
      errorCause: e,
    });
  }
};
