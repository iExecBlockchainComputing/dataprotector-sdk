import { WorkflowError } from '../../utils/errors.js';
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
import { getCollectionForProtectedData } from './smartContract/getterForSharingContract.js';
import {
  onlyCollectionOperator,
  onlyProtectedDataInCollection,
  onlyProtectedDataNotForSale,
} from './smartContract/preFlightCheck.js';

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
  await onlyProtectedDataNotForSale({
    sharingContract,
    protectedDataAddress: vProtectedDataAddress,
  });

  try {
    const tx = await sharingContract.setProtectedDataToSubscription(
      collectionTokenId,
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
