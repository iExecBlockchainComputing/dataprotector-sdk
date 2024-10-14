import { WorkflowError } from '../../utils/errors.js';
import { resolveENS } from '../../utils/resolveENS.js';
import {
  addressOrEnsSchema,
  addressSchema,
  positiveNumberSchema,
  throwIfMissing,
  validateOnStatusUpdateCallback,
} from '../../utils/validators.js';
import {
  AddToCollectionParams,
  AddToCollectionStatuses,
  OnStatusUpdateFn,
  SharingContractConsumer,
  SuccessWithTransactionHash,
} from '../types/index.js';
import { IExecConsumer } from '../types/internalTypes.js';
import { approveProtectedDataForCollectionContract } from './smartContract/approveProtectedDataForCollectionContract.js';
import { getAppWhitelistRegistryContract } from './smartContract/getAddOnlyAppWhitelistRegistryContract.js';
import { getSharingContract } from './smartContract/getSharingContract.js';
import {
  onlyAppWhitelistRegistered,
  onlyCollectionOperator,
  onlyProtectedDataNotInCollection,
} from './smartContract/preflightChecks.js';

export const addToCollection = async ({
  iexec = throwIfMissing(),
  sharingContractAddress = throwIfMissing(),
  collectionId,
  protectedData,
  addOnlyAppWhitelist,
  onStatusUpdate = () => {},
}: IExecConsumer &
  SharingContractConsumer &
  AddToCollectionParams): Promise<SuccessWithTransactionHash> => {
  const vCollectionId = positiveNumberSchema()
    .required()
    .label('collectionId')
    .validateSync(collectionId);
  let vProtectedData = addressOrEnsSchema()
    .required()
    .label('protectedData')
    .validateSync(protectedData);
  const vAddOnlyAppWhitelist = addressSchema()
    .required()
    .label('addOnlyAppWhitelist')
    .validateSync(addOnlyAppWhitelist);
  const vOnStatusUpdate =
    validateOnStatusUpdateCallback<OnStatusUpdateFn<AddToCollectionStatuses>>(
      onStatusUpdate
    );

  // ENS resolution if needed
  vProtectedData = await resolveENS(iexec, vProtectedData);

  let userAddress = await iexec.wallet.getAddress();
  userAddress = userAddress.toLowerCase();

  const sharingContract = await getSharingContract(
    iexec,
    sharingContractAddress
  );

  //---------- Smart Contract Call ----------
  await onlyCollectionOperator({
    sharingContract,
    collectionId: vCollectionId,
    userAddress,
  });
  await onlyProtectedDataNotInCollection({
    sharingContract,
    protectedData: vProtectedData,
  });

  vOnStatusUpdate({
    title: 'APPROVE_COLLECTION_CONTRACT',
    isDone: false,
  });
  const approveTx = await approveProtectedDataForCollectionContract({
    iexec,
    protectedData: vProtectedData,
    sharingContractAddress,
  });

  vOnStatusUpdate({
    title: 'APPROVE_COLLECTION_CONTRACT',
    isDone: true,
    payload: approveTx?.hash
      ? { approveTxHash: approveTx.hash }
      : {
          isAlreadyApproved: true,
          message:
            'Your ProtectedData has already been approved for the smart contract',
        },
  });

  try {
    vOnStatusUpdate({
      title: 'ADD_PROTECTED_DATA_TO_COLLECTION',
      isDone: false,
    });

    const addOnlyAppWhitelistRegistryContract =
      await getAppWhitelistRegistryContract(iexec, sharingContractAddress);
    await onlyAppWhitelistRegistered({
      addOnlyAppWhitelistRegistryContract,
      addOnlyAppWhitelist: vAddOnlyAppWhitelist,
    });

    const { txOptions } = await iexec.config.resolveContractsClient();
    const tx = await sharingContract.addProtectedDataToCollection(
      vCollectionId,
      vProtectedData,
      vAddOnlyAppWhitelist,
      txOptions
    );
    await tx.wait();

    vOnStatusUpdate({
      title: 'ADD_PROTECTED_DATA_TO_COLLECTION',
      isDone: true,
    });

    return {
      txHash: tx.hash,
    };
  } catch (e) {
    throw new WorkflowError({
      message: 'Failed to add protected data to collection',
      errorCause: e,
    });
  }
};
