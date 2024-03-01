import { ErrorWithData, WorkflowError } from '../../utils/errors.js';
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
import { onlyCollectionNotMine } from './smartContract/preflightChecks.js';
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
  });

  await onlyCollectionNotMine({
    sharingContract,
    collectionTokenId: Number(protectedDataDetails.collection),
    userAddress,
  });

  //---------- Pre flight check ----------
  try {
    if (Number(protectedDataDetails.rentingParams.duration) === 0) {
      throw new ErrorWithData(
        'This protected data is not available for renting. ',
        {
          protectedDataAddress,
        }
      );
    }

    const tx = await sharingContract.rentProtectedData(
      protectedDataDetails.collection,
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
