import { ProtectedDataSharing } from '../../../../typechain/index.js';
import { IRental, ISale } from '../../../../typechain/ProtectedDataSharing.js';
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
  if (!protectedDataDetails) {
    throw new Error(
      `ProtectedData does not exist in the protectedDataSharing contract: ${protectedDataAddress}`
    );
  }
  return protectedDataDetails;
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
  if (!collectionDetails) {
    throw new Error(
      `CollectionTokenId does not exist in the protectedDataSharing contract: ${collectionTokenId}`
    );
  }
  return collectionDetails;
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

export const getRentingParams = (
  protectedDataDetails: ProtectedDataDetails
): IRental.RentingParamsStructOutput => {
  if (!protectedDataDetails) {
    throw new Error(`ProtectedData details not found for address`);
  }
  if (!protectedDataDetails.rentingParams) {
    throw new Error(`Renting parameters not found for ProtectedData address`);
  }

  return protectedDataDetails.rentingParams;
};

export const getSellingParams = (
  protectedDataDetails: ProtectedDataDetails
): ISale.SellingParamsStructOutput => {
  if (!protectedDataDetails) {
    throw new Error(`ProtectedData details not found for address`);
  }
  if (!protectedDataDetails.sellingParams) {
    throw new Error(`Selling parameters not found for ProtectedData address`);
  }

  return protectedDataDetails.sellingParams;
};
