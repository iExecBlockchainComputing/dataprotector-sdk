import { type Contract } from 'ethers';
import type { GraphQLClient } from 'graphql-request';
import type { IExec } from 'iexec';
import { ErrorWithData } from '../../utils/errors.js';
import {
  addressSchema,
  positiveNumberSchema,
  throwIfMissing,
} from '../../utils/validators.js';
import {
  Address,
  AddressOrENS,
  AddToCollectionParams,
  IExecConsumer,
  SubgraphConsumer,
} from '../types.js';
import { addProtectedDataToCollection } from './smartContract/addProtectedDataToCollection.js';
import { approveCollectionContract } from './smartContract/approveCollectionContract.js';
import { getCollectionContract } from './smartContract/getCollectionContract.js';
import { getProtectedDataById } from './subgraph/getProtectedDataById.js';

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

  const userAddress = (await iexec.wallet.getAddress()).toLowerCase();

  const protectedData = await checkAndGetProtectedData({
    graphQLClient,
    protectedDataAddress: vProtectedDataAddress,
    userAddress,
  });

  await checkCollection({
    iexec,
    sharingContractAddress,
    collectionId: vCollectionId,
    userAddress,
  });

  onStatusUpdate?.({
    title: 'Give ownership to the collection smart-contract',
    isDone: false,
  });
  // Approve collection SC to change the owner of my protected data in the registry SC
  await approveCollectionContract({
    iexec,
    protectedData,
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

async function checkAndGetProtectedData({
  graphQLClient,
  protectedDataAddress,
  userAddress,
}: {
  graphQLClient: GraphQLClient;
  protectedDataAddress: Address;
  userAddress: Address;
}) {
  const protectedData = await getProtectedDataById({
    graphQLClient,
    protectedDataAddress,
  });

  if (!protectedData) {
    throw new ErrorWithData(
      'This protected data does not exist in the subgraph.',
      { protectedDataAddress }
    );
  }

  if (protectedData.owner.id !== userAddress) {
    throw new ErrorWithData('This protected data is not owned by the user.', {
      protectedDataAddress,
      userAddress,
    });
  }

  return protectedData;
}

async function checkCollection({
  iexec,
  collectionId,
  userAddress,
  sharingContractAddress,
}: {
  iexec: IExec;
  collectionId: number;
  userAddress: Address;
  sharingContractAddress: AddressOrENS;
}) {
  const { provider, signer } = await iexec.config.resolveContractsClient();

  const { collectionContract } = await getCollectionContract({
    provider,
    sharingContractAddress,
  });

  const ownerAddress: Address = await (
    collectionContract.connect(signer) as Contract
  )
    .ownerOf(collectionId)
    .catch(() => {
      // Do nothing
      // An error means that the collection does not exist
    });

  if (!ownerAddress) {
    throw new ErrorWithData('This collection does not seem to exist in the "collection" smart-contract.', {
      collectionId,
    });
  }

  if (ownerAddress !== userAddress) {
    throw new ErrorWithData('This collection is not owned by the user.', {
      userAddress,
      collectionOwnerAddress: ownerAddress,
    });
  }
}
