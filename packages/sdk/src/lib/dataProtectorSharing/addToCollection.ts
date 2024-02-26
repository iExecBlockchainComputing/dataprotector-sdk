import { ethers } from 'ethers';
import {
  DEFAULT_PROTECTED_DATA_SHARING_APP,
  DEFAULT_SHARING_CONTRACT_ADDRESS,
} from '../../config/config.js';
import { ErrorWithData, WorkflowError } from '../../utils/errors.js';
import {
  addressOrEnsOrAnySchema,
  positiveNumberSchema,
  throwIfMissing,
} from '../../utils/validators.js';
import type {
  AddToCollectionParams,
  IExecConsumer,
  SharingContractConsumer,
  SuccessWithTransactionHash,
} from '../types/index.js';
import { approveCollectionContract } from './smartContract/approveCollectionContract.js';
import { getPocoAppRegistryContract } from './smartContract/getPocoRegistryContract.js';
import { getSharingContract } from './smartContract/getSharingContract.js';
import { getCollectionForProtectedData } from './smartContract/getterForSharingContract.js';
import { onlyCollectionOperator } from './smartContract/preFlightCheck.js';

export const addToCollection = async ({
  iexec = throwIfMissing(),
  sharingContractAddress = throwIfMissing(),
  collectionTokenId,
  protectedDataAddress,
  appAddress,
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

  const vProtectedDataAddress = addressOrEnsOrAnySchema()
    .required()
    .label('protectedDataAddress')
    .validateSync(protectedDataAddress);

  const vAppAddress = addressOrEnsOrAnySchema()
    .label('appAddress')
    .validateSync(appAddress);

  const userAddress = (await iexec.wallet.getAddress()).toLowerCase();
  const sharingContract = await getSharingContract(
    iexec,
    sharingContractAddress
  );

  const currentCollectionTokenId = await getCollectionForProtectedData({
    sharingContract,
    protectedDataAddress: vProtectedDataAddress,
  });
  if (currentCollectionTokenId !== 0) {
    throw new ErrorWithData('This protected data is already in a collection', {
      currentCollectionTokenId,
      protectedDataAddress: vProtectedDataAddress,
    });
  }

  await onlyCollectionOperator({
    sharingContract,
    collectionTokenId: vCollectionTokenId,
    userAddress,
  });

  onStatusUpdate?.({
    title: 'APPROVE_COLLECTION_CONTRACT',
    isDone: false,
  });

  // Approve collection SC to change the owner of my protected data in the registry SC
  await approveCollectionContract({
    iexec,
    protectedDataAddress: vProtectedDataAddress,
    sharingContractAddress,
  });

  onStatusUpdate?.({
    title: 'APPROVE_COLLECTION_CONTRACT',
    isDone: true,
  });

  try {
    onStatusUpdate?.({
      title: 'ADD_PROTECTED_DATA_TO_COLLECTION',
      isDone: false,
    });

    if (vAppAddress) {
      const pocoAppRegistryContract = await getPocoAppRegistryContract(iexec);
      const appTokenId = ethers.getBigInt(vAppAddress).toString();
      const appOwner = (
        await pocoAppRegistryContract.ownerOf(appTokenId)
      ).toLowerCase();
      if (appOwner !== DEFAULT_SHARING_CONTRACT_ADDRESS) {
        throw new Error(
          'The provided app is not owned by the DataProtector Sharing contract'
        );
      }
    }
    const tx = await sharingContract.addProtectedDataToCollection(
      vCollectionTokenId,
      vProtectedDataAddress,
      vAppAddress || DEFAULT_PROTECTED_DATA_SHARING_APP // TODO: we should deploy & sconify one
    );
    await tx.wait();

    onStatusUpdate?.({
      title: 'ADD_PROTECTED_DATA_TO_COLLECTION',
      isDone: true,
    });

    return {
      success: true,
      txHash: tx.hash,
    };
  } catch (e) {
    throw new WorkflowError('Failed to add to protected data to collection', e);
  }
};
