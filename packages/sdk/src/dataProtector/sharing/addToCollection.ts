import type { GraphQLClient } from 'graphql-request';
import type { IExec } from 'iexec';
import { throwIfMissing } from '../../utils/validators.js';
import {
  Address,
  AddressOrENS,
  IExecConsumer,
  SubgraphConsumer,
} from '../types.js';
import { createCollection } from './createCollection.js';
import { addProtectedDataToCollection } from './smartContract/addProtectedDataToCollection.js';
import { approveCollectionContract } from './smartContract/approveCollectionContract.js';
import { getCreatorCollections } from './subgraph/getCreatorCollections.js';

export const addToCollection = async ({
  iexec = throwIfMissing(),
  graphQLClient = throwIfMissing(),
  sharingContractAddress,
  protectedDataAddress,
  collectionId,
  addStatus,
}: IExecConsumer &
  SubgraphConsumer & {
    sharingContractAddress: AddressOrENS;
    protectedDataAddress: AddressOrENS;
    collectionId?: number;
    addStatus?: (params: { title: string; isDone: boolean }) => void;
  }): Promise<void> => {
  // TODO: How to check that addStatus is a function?
  // https://zod.dev/?id=functions
  // const vAddStatus: string = addressSchema().label('owner').validateSync(owner);

  console.log('collectionId', collectionId);

  if (collectionId) {
    // TODO: Check that collection belongs to user?
  }

  // FOR TESTS
  let targetCollectionId = 12;

  if (!targetCollectionId) {
    targetCollectionId = await getOrCreateCollection({
      iexec,
      sharingContractAddress,
      graphQLClient,
    });
  }
  console.log('targetCollectionId', targetCollectionId);

  addStatus?.({
    title: 'Ask permission to change ownership of protected data',
    isDone: false,
  });
  // await new Promise((resolve) => setTimeout(resolve, 300));
  // Approve collection SC to change the owner of my protected data in the registry SC
  await approveCollectionContract({
    iexec,
    graphQLClient,
    protectedDataAddress,
    sharingContractAddress,
  });
  addStatus?.({
    title: 'Ask permission to change ownership of protected data',
    isDone: true,
  });

  await new Promise((resolve) => setTimeout(resolve, 300));

  addStatus?.({
    title: 'Smart-contract call to add protected data to your collection',
    isDone: false,
  });
  // await new Promise((resolve) => setTimeout(resolve, 300));
  await addProtectedDataToCollection({
    iexec,
    sharingContractAddress,
    collectionId: targetCollectionId,
    protectedDataAddress,
  });
  addStatus?.({
    title: 'Smart-contract call to add protected data to your collection',
    isDone: true,
  });
};

async function getOrCreateCollection({
  iexec,
  sharingContractAddress,
  graphQLClient,
}: {
  iexec: IExec;
  sharingContractAddress: Address;
  graphQLClient: GraphQLClient;
}) {
  const { signer } = await iexec.config.resolveContractsClient();

  // Get user's collections
  const userAddress = await signer.getAddress();
  console.log('userAddress', userAddress);
  const collections = await getCreatorCollections({
    graphQLClient,
    creatorAddress: userAddress,
  });
  console.log('Existing collections', collections);

  if (collections?.length >= 2) {
    throw new Error(
      'It looks like you have more than one collection, please provide `collectionId` parameter.'
    );
  }

  if (collections?.length === 1) {
    console.log('Has exactly one collection');
    return Number(collections[0].id);
  }

  console.log('Create first collection for user');
  const { collectionId: createdCollectionId } = await createCollection({
    iexec,
    sharingContractAddress,
  });
  console.log('createdCollectionId', createdCollectionId);
  return createdCollectionId;
}
