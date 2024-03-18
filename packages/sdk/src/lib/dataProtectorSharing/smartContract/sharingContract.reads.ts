import { DataProtectorSharing } from '../../../../typechain/sharing-smart-contract/artifacts/contracts/DataProtectorSharing.js';
import {
  Address,
  CollectionDetails,
  ProtectedDataDetails,
} from '../../types/index.js';

export const getCollectionDetails = async ({
  sharingContract,
  collectionTokenId,
}: {
  sharingContract: DataProtectorSharing;
  collectionTokenId: number;
}): Promise<CollectionDetails> => {
  const [collectionDetails, collectionOwnerResult] = await Promise.all([
    sharingContract.collectionDetails(collectionTokenId),
    sharingContract.ownerOf(collectionTokenId).catch(() => {
      return null; // Use null or a similar placeholder to indicate failure
    }),
  ]);

  if (!collectionOwnerResult) {
    throw new Error(
      `CollectionTokenId does not exist in the protectedDataSharing contract: ${collectionTokenId}`
    );
  }

  return {
    collectionOwner: collectionOwnerResult.toLowerCase(),
    size: Number(collectionDetails.size),
    latestSubscriptionExpiration: Number(
      collectionDetails.lastSubscriptionExpiration
    ),
    subscriptionParams: {
      price: Number(collectionDetails.subscriptionParams.price),
      duration: Number(collectionDetails.subscriptionParams.duration),
    },
  };
};

export const getProtectedDataDetails = async ({
  sharingContract,
  protectedDataAddress,
  userAddress,
}: {
  sharingContract: DataProtectorSharing;
  protectedDataAddress: Address;
  userAddress: Address;
}): Promise<ProtectedDataDetails> => {
  const protectedDataDetails = await sharingContract.protectedDataDetails(
    protectedDataAddress
  );

  if (protectedDataDetails.collection === BigInt(0)) {
    throw new Error(
      `The protected data is not a part of a collection: ${protectedDataAddress}`
    );
  }

  //TODO: implement multicall
  const [
    collectionDetails,
    userLatestRentalExpiration,
    userLatestSubscriptionExpiration,
  ] = await Promise.all([
    getCollectionDetails({
      sharingContract,
      collectionTokenId: Number(protectedDataDetails.collection),
    }),
    sharingContract.getProtectedDataRenter(protectedDataAddress, userAddress),
    sharingContract.getCollectionSubscriber(
      protectedDataDetails.collection,
      userAddress
    ),
  ]);

  return {
    appWhitelist: protectedDataDetails.appWhitelist,
    latestRentalExpiration: Number(protectedDataDetails.lastRentalExpiration),
    isInSubscription: protectedDataDetails.inSubscription,
    userLatestRentalExpiration: Number(userLatestRentalExpiration),
    rentingParams: {
      isForRent: Number(protectedDataDetails.rentingParams.duration) > 0,
      price: Number(protectedDataDetails.rentingParams.price),
      duration: Number(protectedDataDetails.rentingParams.duration),
    },
    sellingParams: {
      isForSale: protectedDataDetails.sellingParams.isForSale,
      price: Number(protectedDataDetails.sellingParams.price),
    },
    collection: {
      collectionTokenId: Number(protectedDataDetails.collection),
      userLatestSubscriptionExpiration: Number(
        userLatestSubscriptionExpiration
      ),
      ...collectionDetails,
    },
  };
};
