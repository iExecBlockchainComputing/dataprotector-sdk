import { ProtectedDataSharing } from '../../../../typechain/index.js';
import {
  Address,
  CollectionDetails,
  ProtectedDataDetails,
} from '../../types/index.js';

export const getProtectedDataDetails = async ({
  sharingContract,
  protectedDataAddress,
}: {
  sharingContract: ProtectedDataSharing;
  protectedDataAddress: Address;
}): Promise<ProtectedDataDetails> => {
  const protectedDataDetails = await sharingContract.protectedDataDetails(
    protectedDataAddress
  );
  let collectionOwner = await sharingContract.ownerOf(
    protectedDataDetails.collection
  );
  collectionOwner = collectionOwner.toLowerCase();

  if (!protectedDataDetails) {
    throw new Error(
      `ProtectedData does not exist in the protectedDataSharing contract: ${protectedDataAddress}`
    );
  }
  return { ...protectedDataDetails, collectionOwner };
};

export const getCollectionDetails = async ({
  sharingContract,
  collectionTokenId,
}: {
  sharingContract: ProtectedDataSharing;
  collectionTokenId: number;
}): Promise<CollectionDetails> => {
  const collectionDetails = await sharingContract.collectionDetails(
    collectionTokenId
  );
  let collectionOwner = await sharingContract.ownerOf(collectionTokenId);
  collectionOwner = collectionOwner.toLowerCase();

  if (!collectionDetails) {
    throw new Error(
      `CollectionTokenId does not exist in the protectedDataSharing contract: ${collectionTokenId}`
    );
  }
  return { ...collectionDetails, collectionOwner };
};

export const getRentalExpiration = async ({
  sharingContract,
  protectedDataAddress,
  userAddress,
}: {
  sharingContract: ProtectedDataSharing;
  protectedDataAddress: Address;
  userAddress: Address;
}): Promise<number> => {
  const expiration = await sharingContract.getProtectedDataRenter(
    protectedDataAddress,
    userAddress
  );
  return Number(expiration);
};

export const getSubscriberExpiration = async ({
  sharingContract,
  collectionTokenId,
  userAddress,
}: {
  sharingContract: ProtectedDataSharing;
  collectionTokenId: bigint;
  userAddress: Address;
}): Promise<number> => {
  const expiration = await sharingContract.getCollectionSubscriber(
    collectionTokenId,
    userAddress
  );
  return Number(expiration);
};
