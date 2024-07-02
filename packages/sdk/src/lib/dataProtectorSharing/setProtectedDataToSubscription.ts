import { WorkflowError } from '../../utils/errors.js';
import { resolveENS } from '../../utils/resolveENS.js';
import { addressOrEnsSchema, throwIfMissing } from '../../utils/validators.js';
import {
  SetProtectedDataToSubscriptionParams,
  SharingContractConsumer,
  SuccessWithTransactionHash,
} from '../types/index.js';
import { IExecConsumer } from '../types/internalTypes.js';
import { getSharingContract } from './smartContract/getSharingContract.js';
import {
  onlyProtectedDataNotIncludedInSubscription,
  onlyCollectionOperator,
  onlyProtectedDataNotCurrentlyForSale,
} from './smartContract/preflightChecks.js';
import { getProtectedDataDetails } from './smartContract/sharingContract.reads.js';

export const setProtectedDataToSubscription = async ({
  iexec = throwIfMissing(),
  sharingContractAddress = throwIfMissing(),
  protectedData = throwIfMissing(),
}: IExecConsumer &
  SharingContractConsumer &
  SetProtectedDataToSubscriptionParams): Promise<SuccessWithTransactionHash> => {
  let vProtectedData = addressOrEnsSchema()
    .required()
    .label('protectedData')
    .validateSync(protectedData);

  // ENS resolution if needed
  vProtectedData = await resolveENS(iexec, vProtectedData);

  let userAddress = await iexec.wallet.getAddress();
  userAddress = userAddress.toLowerCase();

  const sharingContract = await getSharingContract(
    iexec,
    sharingContractAddress
  );

  //---------- Smart Contract Call ----------
  const protectedDataDetails = await getProtectedDataDetails({
    sharingContract,
    protectedData: vProtectedData,
    userAddress,
  });
  await onlyCollectionOperator({
    sharingContract,
    collectionId: Number(protectedDataDetails.collection.collectionId),
    userAddress,
  });

  //---------- Pre flight check ----------
  onlyProtectedDataNotCurrentlyForSale(protectedDataDetails);
  onlyProtectedDataNotIncludedInSubscription(protectedDataDetails);

  try {
    const { txOptions } = await iexec.config.resolveContractsClient();
    const tx = await sharingContract.setProtectedDataToSubscription(
      vProtectedData,
      txOptions
    );
    await tx.wait();

    return {
      txHash: tx.hash,
    };
  } catch (e) {
    throw new WorkflowError({
      message:
        'Failed to set ProtectedData To Subscription into sharing smart contract',
      errorCause: e,
    });
  }
};
