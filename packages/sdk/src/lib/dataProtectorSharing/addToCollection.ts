import { DEFAULT_PROTECTED_DATA_SHARING_APP_WHITELIST } from '../../config/config.js';
import { WorkflowError } from '../../utils/errors.js';
import { resolveENS } from '../../utils/resolveENS.js';
import {
  addressOrEnsSchema,
  addressSchema,
  positiveNumberSchema,
  throwIfMissing,
} from '../../utils/validators.js';
import type {
  AddToCollectionParams,
  SharingContractConsumer,
  SuccessWithTransactionHash,
} from '../types/index.js';
import { IExecConsumer } from '../types/internalTypes.js';
import { approveCollectionContract } from './smartContract/approveCollectionContract.js';
import { getAppWhitelistRegistryContract } from './smartContract/getAppWhitelistRegistryContract.js';
import { getSharingContract } from './smartContract/getSharingContract.js';
import {
  onlyAppWhitelistRegisteredAndManagedByOwner,
  onlyCollectionOperator,
  onlyProtectedDataNotInCollection,
} from './smartContract/preflightChecks.js';

export const addToCollection = async ({
  iexec = throwIfMissing(),
  sharingContractAddress = throwIfMissing(),
  collectionTokenId,
  protectedDataAddress,
  appWhitelist,
  onStatusUpdate,
}: IExecConsumer &
  SharingContractConsumer &
  AddToCollectionParams): Promise<SuccessWithTransactionHash> => {
  // TODO: How to check that onStatusUpdate is a function?
  // Example in zod: https://zod.dev/?id=functions
  // const vonStatusUpdate: string = fnSchema().label('onStatusUpdate').validateSync(onStatusUpdate);
  const vCollectionTokenId = positiveNumberSchema()
    .required()
    .label('collectionTokenId')
    .validateSync(collectionTokenId);
  let vProtectedDataAddress = addressOrEnsSchema()
    .required()
    .label('protectedDataAddress')
    .validateSync(protectedDataAddress);
  const vAppWhitelist = addressSchema()
    .label('appAddress')
    .validateSync(appWhitelist);

  // ENS resolution if needed
  vProtectedDataAddress = await resolveENS(iexec, vProtectedDataAddress);

  let userAddress = await iexec.wallet.getAddress();
  userAddress = userAddress.toLowerCase();

  const sharingContract = await getSharingContract(
    iexec,
    sharingContractAddress
  );

  //---------- Smart Contract Call ----------
  await onlyCollectionOperator({
    sharingContract,
    collectionTokenId: vCollectionTokenId,
    userAddress,
  });
  await onlyProtectedDataNotInCollection({
    sharingContract,
    protectedDataAddress: vProtectedDataAddress,
  });

  onStatusUpdate?.({
    title: 'APPROVE_COLLECTION_CONTRACT',
    isDone: false,
  });
  const approveTx = await approveCollectionContract({
    iexec,
    protectedDataAddress: vProtectedDataAddress,
    sharingContractAddress,
  });
  onStatusUpdate?.({
    title: 'APPROVE_COLLECTION_CONTRACT',
    isDone: true,
    payload: {
      approveTxHash: approveTx.hash,
    },
  });

  try {
    onStatusUpdate?.({
      title: 'ADD_PROTECTED_DATA_TO_COLLECTION',
      isDone: false,
    });

    if (vAppWhitelist) {
      const appWhitelistRegistryContract =
        await getAppWhitelistRegistryContract(iexec, sharingContractAddress);
      await onlyAppWhitelistRegisteredAndManagedByOwner({
        appWhitelistRegistryContract,
        appWhitelist,
        userAddress,
      });
    }
    const { txOptions } = await iexec.config.resolveContractsClient();
    const tx = await sharingContract.addProtectedDataToCollection(
      vCollectionTokenId,
      vProtectedDataAddress,
      vAppWhitelist || DEFAULT_PROTECTED_DATA_SHARING_APP_WHITELIST,
      txOptions
    );
    await tx.wait();

    onStatusUpdate?.({
      title: 'ADD_PROTECTED_DATA_TO_COLLECTION',
      isDone: true,
    });

    return {
      txHash: tx.hash,
    };
  } catch (e) {
    throw new WorkflowError('Failed to add protected data to collection', e);
  }
};
