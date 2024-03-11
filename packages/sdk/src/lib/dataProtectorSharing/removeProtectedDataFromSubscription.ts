import { WorkflowError } from '../../utils/errors.js';
import {
  addressOrEnsOrAnySchema,
  throwIfMissing,
} from '../../utils/validators.js';
import {
  RemoveProtectedDataFromSubscriptionParams,
  SharingContractConsumer,
  SuccessWithTransactionHash,
} from '../types/index.js';
import { IExecConsumer, SubgraphConsumer } from '../types/internalTypes.js';
import { getSharingContract } from './smartContract/getSharingContract.js';
import {
  onlyProtectedDataIncludedInSubscription,
  onlyCollectionNotSubscribed,
  onlyCollectionOperator,
} from './smartContract/preflightChecks.js';
import { getProtectedDataDetails } from './smartContract/sharingContract.reads.js';

export const removeProtectedDataFromSubscription = async ({
  iexec = throwIfMissing(),
  sharingContractAddress = throwIfMissing(),
  protectedDataAddress,
}: IExecConsumer &
  SubgraphConsumer &
  SharingContractConsumer &
  RemoveProtectedDataFromSubscriptionParams): Promise<SuccessWithTransactionHash> => {
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
  await onlyCollectionOperator({
    sharingContract,
    collectionTokenId: Number(
      protectedDataDetails.collection.collectionTokenId
    ),
    userAddress,
  });

  //---------- Pre flight check ----------
  onlyCollectionNotSubscribed(protectedDataDetails);
  onlyProtectedDataIncludedInSubscription(protectedDataDetails);

  try {
    const { txOptions } = await iexec.config.resolveContractsClient();
    const tx = await sharingContract.removeProtectedDataFromSubscription(
      protectedDataDetails.collection.collectionTokenId,
      vProtectedDataAddress,
      txOptions
    );
    await tx.wait();

    return {
      txHash: tx.hash,
    };
  } catch (e) {
    throw new WorkflowError(
      'Failed to Remove Protected Data From Subscription',
      e
    );
  }
};
