import { WorkflowError } from '../../utils/errors.js';
import {
  addressOrEnsOrAnySchema,
  throwIfMissing,
} from '../../utils/validators.js';
import {
  IExecConsumer,
  RemoveFromCollectionParams,
  SharingContractConsumer,
  SuccessWithTransactionHash,
} from '../types/index.js';
import { getSharingContract } from './smartContract/getSharingContract.js';
import { getCollectionForProtectedData } from './smartContract/getterForSharingContract.js';
import {
  onlyCollectionNotSubscribed,
  onlyCollectionOperator,
  onlyProtectedDataInCollection,
  onlyProtectedDataNotRented,
} from './smartContract/preFlightCheck.js';

export const removeFromCollection = async ({
  iexec = throwIfMissing(),
  sharingContractAddress = throwIfMissing(),
  protectedDataAddress = throwIfMissing(),
}: IExecConsumer &
  SharingContractConsumer &
  RemoveFromCollectionParams): Promise<SuccessWithTransactionHash> => {
  const vProtectedDataAddress = addressOrEnsOrAnySchema()
    .required()
    .label('protectedDataAddress')
    .validateSync(protectedDataAddress);

  const userAddress = (await iexec.wallet.getAddress()).toLowerCase();
  const sharingContract = await getSharingContract(
    iexec,
    sharingContractAddress
  );

  const collectionTokenId = await getCollectionForProtectedData({
    sharingContract,
    protectedDataAddress: vProtectedDataAddress,
  });

  await onlyCollectionOperator({
    sharingContract,
    collectionTokenId: collectionTokenId,
    userAddress,
  });
  await onlyProtectedDataInCollection({
    sharingContract,
    protectedDataAddress: vProtectedDataAddress,
  });
  await onlyCollectionNotSubscribed({
    sharingContract,
    collectionTokenId: collectionTokenId,
  });
  await onlyProtectedDataNotRented({
    sharingContract,
    protectedDataAddress: vProtectedDataAddress,
  });

  try {
    const tx = await sharingContract.removeProtectedDataFromCollection(
      collectionTokenId,
      vProtectedDataAddress
    );
    await tx.wait();

    return {
      success: true,
      txHash: tx.hash,
    };
  } catch (e) {
    throw new WorkflowError('Failed to Remove Protected Data From Renting', e);
  }
};
