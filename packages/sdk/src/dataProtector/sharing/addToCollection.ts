import {
  addressSchema,
  positiveNumberSchema,
  throwIfMissing,
} from '../../utils/validators.js';
import {
  AddressOrENS,
  AddToCollectionParams,
  IExecConsumer,
  SubgraphConsumer,
} from '../types.js';
import { addProtectedDataToCollection } from './smartContract/addProtectedDataToCollection.js';
import { approveCollectionContract } from './smartContract/approveCollectionContract.js';

export const addToCollection = async ({
  iexec = throwIfMissing(),
  graphQLClient = throwIfMissing(),
  sharingContractAddress,
  protectedDataAddress: existingProtectedDataAddress,
  collectionId,
  onStatusUpdate,
}: IExecConsumer &
  SubgraphConsumer & {
    dataProtectorContractAddress: AddressOrENS;
    sharingContractAddress: AddressOrENS;
  } & AddToCollectionParams): Promise<void> => {
  // TODO: How to check that onStatusUpdate is a function?
  // Example in zod: https://zod.dev/?id=functions
  // const vonStatusUpdate: string = fnSchema().label('onStatusUpdate').validateSync(onStatusUpdate);

  const vProtectedDataAddress = addressSchema()
    .required()
    .label('protectedDataAddress')
    .validateSync(existingProtectedDataAddress);
  const vCollectionId = positiveNumberSchema()
    .required()
    .label('collectionId')
    .validateSync(collectionId);

  onStatusUpdate?.({
    title: 'Give ownership to the collection smart-contract',
    isDone: false,
  });
  // Approve collection SC to change the owner of my protected data in the registry SC
  await approveCollectionContract({
    iexec,
    graphQLClient,
    protectedDataAddress: vProtectedDataAddress,
    sharingContractAddress,
  });
  onStatusUpdate?.({
    title: 'Give ownership to the collection smart-contract',
    isDone: true,
  });

  onStatusUpdate?.({
    title: 'Add protected data to your collection',
    isDone: false,
  });
  await addProtectedDataToCollection({
    iexec,
    sharingContractAddress,
    collectionId: vCollectionId,
    protectedDataAddress: vProtectedDataAddress,
  });
  onStatusUpdate?.({
    title: 'Add protected data to your collection',
    isDone: true,
  });
};
