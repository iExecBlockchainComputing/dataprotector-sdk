import { ethers } from 'ethers';
import type { GraphQLClient } from 'graphql-request';
import {
  DEFAULT_PROTECTED_DATA_SHARING_APP,
  DEFAULT_SHARING_CONTRACT_ADDRESS,
} from '../../config/config.js';
import { ErrorWithData } from '../../utils/errors.js';
import {
  addressOrEnsOrAnySchema,
  positiveNumberSchema,
  throwIfMissing,
} from '../../utils/validators.js';
import type {
  Address,
  AddToCollectionParams,
  IExecConsumer,
  SubgraphConsumer,
  SuccessWithTransactionHash,
} from '../types/index.js';
import { approveCollectionContract } from './smartContract/approveCollectionContract.js';
import { getPocoAppRegistryContract } from './smartContract/getPocoRegistryContract.js';
import { getSharingContract } from './smartContract/getSharingContract.js';
import { getProtectedDataById } from './subgraph/getProtectedDataById.js';

export const addToCollection = async ({
  iexec = throwIfMissing(),
  graphQLClient = throwIfMissing(),
  sharingContractAddress,
  collectionTokenId,
  protectedDataAddress,
  appAddress = DEFAULT_PROTECTED_DATA_SHARING_APP,
  onStatusUpdate,
}: IExecConsumer &
  SubgraphConsumer & {
    sharingContractAddress: Address;
  } & AddToCollectionParams): Promise<SuccessWithTransactionHash> => {
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

  const protectedData = await checkAndGetProtectedData({
    graphQLClient,
    protectedDataAddress: vProtectedDataAddress,
    userAddress,
  });

  await checkCollection({
    collectionTokenId: vCollectionTokenId,
    userAddress,
  });

  onStatusUpdate?.({
    title: 'Give ownership to the collection smart-contract',
    isDone: false,
  });
  // Approve collection SC to change the owner of my protected data in the registry SC
  await approveCollectionContract({
    protectedDataAddress: protectedData.id,
    protectedDataCurrentOwnerAddress: protectedData.owner.id,
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

  const pocoAppRegistryContract = await getPocoAppRegistryContract();
  const appTokenId = ethers.getBigInt(vAppAddress).toString();
  const appOwner = (
    await pocoAppRegistryContract.ownerOf(appTokenId)
  ).toLowerCase();
  if (appOwner !== DEFAULT_SHARING_CONTRACT_ADDRESS) {
    throw new Error(
      'The App is not owner by the protectedDataSharing Contract'
    );
  }

  const sharingContract = await getSharingContract();
  const tx = await sharingContract.addProtectedDataToCollection(
    vCollectionTokenId,
    vProtectedDataAddress,
    vAppAddress, // TODO: we should deploy & sconify one
    {
      // TODO: See how we can remove this
      gasLimit: 900_000,
    }
  );
  await tx.wait();

  onStatusUpdate?.({
    title: 'Add protected data to your collection',
    isDone: true,
  });

  return {
    success: true,
    txHash: tx.hash,
  };
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
  collectionTokenId,
  userAddress,
}: {
  collectionTokenId: number;
  userAddress: Address;
}) {
  const sharingContract = await getSharingContract();
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
