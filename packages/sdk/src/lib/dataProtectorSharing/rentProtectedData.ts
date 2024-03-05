import { WorkflowError } from '../../utils/errors.js';
import {
  addressOrEnsOrAnySchema,
  throwIfMissing,
} from '../../utils/validators.js';
import {
  IExecConsumer,
  RentProtectedDataParams,
  SharingContractConsumer,
  SuccessWithTransactionHash,
} from '../types/index.js';
import { getSharingContract } from './smartContract/getSharingContract.js';
import {
  onlyCollectionNotMine,
  onlyProtectedDataCurrentlyForRent,
} from './smartContract/preflightChecks.js';
import { getProtectedDataDetails } from './smartContract/sharingContract.reads.js';

export const rentProtectedData = async ({
  iexec = throwIfMissing(),
  sharingContractAddress = throwIfMissing(),
  protectedDataAddress,
}: IExecConsumer &
  SharingContractConsumer &
  RentProtectedDataParams): Promise<SuccessWithTransactionHash> => {
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
    userAddress,
  });

  //---------- Pre flight check ----------
  onlyCollectionNotMine({
    collectionOwner: protectedDataDetails.collection.collectionOwner,
    userAddress,
    errorMessage:
      'You cannot rent a protected data that belongs to one of your own collections.',
  });
  onlyProtectedDataCurrentlyForRent(protectedDataDetails);

  try {
    const tx = await sharingContract.rentProtectedData(
      protectedDataDetails.collection.collectionTokenId,
      vProtectedDataAddress,
      {
        value: protectedDataDetails.rentingParams.price,
      }
    );
    await tx.wait();

    return {
      success: true,
      txHash: tx.hash,
    };
  } catch (e) {
    throw new WorkflowError('Failed to rent protected data', e);
  }
};
