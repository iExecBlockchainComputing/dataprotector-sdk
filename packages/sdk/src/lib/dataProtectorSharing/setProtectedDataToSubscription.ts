import { ErrorWithData, WorkflowError } from '../../utils/errors.js';
import {
  addressOrEnsOrAnySchema,
  throwIfMissing,
} from '../../utils/validators.js';
import {
  IExecConsumer,
  SetProtectedDataToSubscriptionParams,
  SharingContractConsumer,
  SuccessWithTransactionHash,
} from '../types/index.js';
import { getSharingContract } from './smartContract/getSharingContract.js';
import {
  onlyCollectionOperator,
  onlyProtectedDataNotForSale,
} from './smartContract/preflightChecks.js';
import { getProtectedDataDetails } from './smartContract/sharingContract.reads.js';

export const setProtectedDataToSubscription = async ({
  iexec = throwIfMissing(),
  sharingContractAddress = throwIfMissing(),
  protectedDataAddress = throwIfMissing(),
}: IExecConsumer &
  SharingContractConsumer &
  SetProtectedDataToSubscriptionParams): Promise<SuccessWithTransactionHash> => {
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
  onlyProtectedDataNotForSale(protectedDataDetails);

  if (protectedDataDetails.inSubscription) {
    throw new ErrorWithData('This protected data is already in subscription.', {
      protectedDataAddress: vProtectedDataAddress,
    });
  }

  try {
    const tx = await sharingContract.setProtectedDataToSubscription(
      protectedDataDetails.collection,
      vProtectedDataAddress
    );
    await tx.wait();

    return {
      success: true,
      txHash: tx.hash,
    };
  } catch (e) {
    throw new WorkflowError(
      'Failed to set ProtectedData To Subscription into sharing smart contract',
      e
    );
  }
};
