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
import { onlyCollectionOperator } from './smartContract/preflightChecks.js';
import { getProtectedDataDetails } from './smartContract/sharingContract.reads.js';

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

  let userAddress = await iexec.wallet.getAddress();
  userAddress = userAddress.toLowerCase();
  const sharingContract = await getSharingContract(
    iexec,
    sharingContractAddress
  );

  //---------- Smart Contract Call ----------
  const protectedDataDetails = await getProtectedDataDetails({
    sharingContract,
    protectedDataAddress: vProtectedDataAddress,
  });
  await onlyCollectionOperator({
    sharingContract,
    collectionTokenId: Number(protectedDataDetails.collection),
    userAddress,
  });

  //---------- Pre flight check ----------
  if (Number(protectedDataDetails.rentingParams.duration) === 0) {
    throw new ErrorWithData(
      'This protected data has already been removed from renting.',
      {
        protectedDataAddress: vProtectedDataAddress,
      }
    );
  }

  try {
    const tx = await sharingContract.removeProtectedDataFromRenting(
      protectedDataDetails.collection,
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
