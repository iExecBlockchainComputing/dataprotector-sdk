import { ErrorWithData, WorkflowError } from '../../utils/errors.js';
import {
  addressOrEnsOrAnySchema,
  throwIfMissing,
} from '../../utils/validators.js';
import {
  IExecConsumer,
  RemoveProtectedDataFromRentingParams,
  SharingContractConsumer,
  SuccessWithTransactionHash,
} from '../types/index.js';
import { getSharingContract } from './smartContract/getSharingContract.js';
import {
  getCollectionForProtectedData,
  getRentingParams,
} from './smartContract/getterForSharingContract.js';
import {
  onlyCollectionOperator,
  onlyProtectedDataInCollection,
} from './smartContract/preflightChecks.js';

export const removeProtectedDataFromRenting = async ({
  iexec = throwIfMissing(),
  sharingContractAddress = throwIfMissing(),
  protectedDataAddress = throwIfMissing(),
}: IExecConsumer &
  SharingContractConsumer &
  RemoveProtectedDataFromRentingParams): Promise<SuccessWithTransactionHash> => {
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

  const rentingParams = await getRentingParams({
    sharingContract,
    protectedDataAddress: vProtectedDataAddress,
  });
  if (rentingParams.duration === 0) {
    throw new ErrorWithData(
      'This protected data has already been removed from renting.',
      {
        protectedDataAddress: vProtectedDataAddress,
      }
    );
  }

  try {
    const tx = await sharingContract.removeProtectedDataFromRenting(
      collectionTokenId,
      vProtectedDataAddress
    );
    await tx.wait();

    return {
      success: true,
      txHash: tx.hash,
    };
  } catch (e) {
    throw new WorkflowError('Failed to remove protected data from renting.', e);
  }
};
