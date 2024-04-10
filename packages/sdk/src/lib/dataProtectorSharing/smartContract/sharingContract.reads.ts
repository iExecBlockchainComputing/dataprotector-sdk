import { DataProtectorSharing } from '../../../../generated/typechain/sharing/DataProtectorSharing.js';
import {
  Address,
  Collection,
  ProtectedDataDetails,
} from '../../types/index.js';

export const getCollectionDetails = async ({
  sharingContract,
  collectionTokenId,
}: {
  sharingContract: DataProtectorSharing;
  collectionTokenId: number;
}): Promise<Collection> => {
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
    collectionTokenId,
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
  protectedData,
  userAddress,
}: {
  sharingContract: DataProtectorSharing;
  protectedData: Address;
  userAddress: Address;
}): Promise<ProtectedDataDetails> => {
  const protectedDataDetails = await sharingContract.protectedDataDetails(
    protectedData
  );

  if (protectedDataDetails.collection === BigInt(0)) {
    throw new Error(
      `The protected data is not a part of a collection: ${protectedData}`
    );
  }

  //TODO: implement multicall
  const [collectionDetails, userLatestSubscriptionExpiration] =
    await Promise.all([
      getCollectionDetails({
        sharingContract,
        collectionTokenId: Number(protectedDataDetails.collection),
      }),
      sharingContract.getCollectionSubscriber(
        protectedDataDetails.collection,
        userAddress
      ),
    ]);

  return {
    appWhitelist: protectedDataDetails.appWhitelist,
    latestRentalExpiration: Number(protectedDataDetails.lastRentalExpiration),
    isInSubscription: protectedDataDetails.inSubscription,
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
      latestSubscriptionExpiration: Number(userLatestSubscriptionExpiration),
      ...collectionDetails,
    },
  };
};
