import type { GraphQLClient } from 'graphql-request';
import type { IExec } from 'iexec';
import { DEFAULT_PROTECTED_DATA_SHARING_APP } from '../../config/config.js';
import { ErrorWithData } from '../../utils/errors.js';
import {
  addressOrEnsOrAnySchema,
  positiveNumberSchema,
} from '../../utils/validators.js';
import type {
  Address,
  AddToCollectionParams,
  SuccessWithTransactionHash,
} from '../types/index.js';
import { addProtectedDataToCollection } from './smartContract/addProtectedDataToCollection.js';
import { approveCollectionContract } from './smartContract/approveCollectionContract.js';
import { getSharingContract } from './smartContract/getSharingContract.js';
import { getProtectedDataById } from './subgraph/getProtectedDataById.js';

export async function addToCollection({
  collectionTokenId,
  protectedDataAddress,
  appAddress,
  onStatusUpdate,
}: AddToCollectionParams): Promise<SuccessWithTransactionHash> {
  // TODO: How to check that onStatusUpdate is a function?
  // Example in zod: https://zod.dev/?id=functions
  // const vonStatusUpdate: string = fnSchema().label('onStatusUpdate').validateSync(onStatusUpdate);

  const vCollectionTokenId = positiveNumberSchema()
    .required()
    .label('collectionTokenId')
    .validateSync(collectionTokenId);
  console.log('vCollectionTokenId', vCollectionTokenId);

  const vProtectedDataAddress = addressOrEnsOrAnySchema()
    .required()
    .label('protectedDataAddress')
    .validateSync(protectedDataAddress);
  console.log('vProtectedDataAddress', vProtectedDataAddress);

  const vAppAddress = addressOrEnsOrAnySchema()
    .label('appAddress')
    .validateSync(appAddress);

  const userAddress = (await this.iexec.wallet.getAddress()).toLowerCase();
  console.log('userAddress', userAddress);

  const protectedData = await checkAndGetProtectedData({
    graphQLClient: this.graphQLClient,
    protectedDataAddress: vProtectedDataAddress,
    userAddress,
  });

  await checkCollection({
    iexec: this.iexec,
    sharingContractAddress: this.sharingContractAddress,
    collectionTokenId: vCollectionTokenId,
    userAddress,
  });

  onStatusUpdate?.({
    title: 'Give ownership to the collection smart-contract',
    isDone: false,
  });
  // Approve collection SC to change the owner of my protected data in the registry SC
  await approveCollectionContract({
    iexec: this.iexec,
    protectedDataAddress: protectedData.id,
    protectedDataCurrentOwnerAddress: protectedData.owner.id,
    sharingContractAddress: this.sharingContractAddress,
  });
  onStatusUpdate?.({
    title: 'Give ownership to the collection smart-contract',
    isDone: true,
  });

  onStatusUpdate?.({
    title: 'Add protected data to your collection',
    isDone: false,
  });
  const txHash = await addProtectedDataToCollection({
    iexec: this.iexec,
    sharingContractAddress: this.sharingContractAddress,
    collectionTokenId: vCollectionTokenId,
    protectedDataAddress: vProtectedDataAddress,
    appAddress: vAppAddress || DEFAULT_PROTECTED_DATA_SHARING_APP, // TODO: we should deploy & sconify one
  });
  onStatusUpdate?.({
    title: 'Add protected data to your collection',
    isDone: true,
  });

  return {
    success: true,
    txHash,
  };
}

async function checkAndGetProtectedData({
  graphQLClient,
  protectedDataAddress,
  userAddress,
}: {
  graphQLClient: GraphQLClient;
  protectedDataAddress: Address;
  userAddress: Address;
}) {
  const { protectedData } = await getProtectedDataById({
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
  sharingContractAddress,
  collectionTokenId,
  userAddress,
}: {
  iexec: IExec;
  sharingContractAddress: Address;
  collectionTokenId: number;
  userAddress: Address;
}) {
  console.log('collectionTokenId', collectionTokenId);
  const sharingContract = await getSharingContract(
    iexec,
    sharingContractAddress
  );
  const ownerAddress: Address | undefined = await sharingContract
    .ownerOf(collectionTokenId)
    .catch(() => {
      // Do nothing
      // An error means that the collection does not exist
      // TODO: catch the revert custom error : error ERC721NonexistentToken(uint256 tokenId);
      // const error = sharingContract.interface.decodeErrorResult(
      //   'ERC721NonexistentToken',
      //   err.data.data
      // )[0];
      // console.log('decoded error', error);
    });
  console.log('ownerAddress', ownerAddress);

  if (!ownerAddress) {
    throw new ErrorWithData(
      'This collection does not seem to exist in the "collection" smart-contract.',
      {
        collectionTokenId,
      }
    );
  }

  if (ownerAddress.toLowerCase() !== userAddress) {
    throw new ErrorWithData('This collection is not owned by the user.', {
      userAddress,
      collectionOwnerAddress: ownerAddress,
    });
  }
}
