import { ProtectedDataSharing } from '../../../../typechain/index.js';
import {
  Address,
  CollectionDetails,
  ProtectedDataDetails,
} from '../../types/index.js';

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

  let collectionOwner = await sharingContract
    .ownerOf(collectionTokenId)
    .catch(() => {
      throw new Error(
        `CollectionTokenId does not exist in the protectedDataSharing contract: ${collectionTokenId}`
      );
    });
  collectionOwner = collectionOwner.toLowerCase();

  return {
    collectionOwner,
    size: Number(collectionDetails.size),
    subscriptionExpiration: Number(collectionDetails.subscriptionExpiration),
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
  sharingContract: ProtectedDataSharing;
  protectedDataAddress: Address;
  userAddress: Address;
}): Promise<ProtectedDataDetails> => {
  // 1er call
  const protectedDataDetails = await sharingContract.protectedDataDetails(
    protectedDataAddress
  );

  if (protectedDataDetails.collection === BigInt(0)) {
    throw new Error(
      `The protected data is not a part of a collection: ${protectedDataAddress}`
    );
  }

  // 2eme call
  const collectionDetails = await getCollectionDetails({
    sharingContract,
    collectionTokenId: Number(protectedDataDetails.collection),
  });

  // 3eme call
  const userRentalExpiration = await sharingContract.getProtectedDataRenter(
    protectedDataAddress,
    userAddress
  );

  // 4eme call
  const userSubscriptionExpiration =
    await sharingContract.getCollectionSubscriber(
      protectedDataDetails.collection,
      userAddress
    );

  return {
    app: protectedDataDetails.app,
    rentalExpiration: Number(protectedDataDetails.rentalExpiration),
    inSubscription: protectedDataDetails.inSubscription,
    userRentalExpiration: Number(userRentalExpiration),
    rentingParams: {
      price: Number(protectedDataDetails.rentingParams.price),
      duration: Number(protectedDataDetails.rentingParams.duration),
    },
    sellingParams: {
      isForSale: protectedDataDetails.sellingParams.isForSale,
      price: Number(protectedDataDetails.sellingParams.price),
    },
    collection: {
      collectionTokenId: Number(protectedDataDetails.collection),
      userSubscriptionExpiration: Number(userSubscriptionExpiration),
      ...collectionDetails,
    },
  };
};
