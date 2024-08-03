import type { DataProtectorSharing } from '../../../../generated/typechain/sharing/DataProtectorSharing.js';
import type {
  Address,
  Collection,
  ProtectedDataDetails,
} from '../../types/index.js';

//###############################################################################
// Parallelized calls to batch requests in ethers JsonRpcApiProvider
// (https://docs.ethers.org/v6/api/providers/jsonrpc/#JsonRpcApiProviderOptions)
//###############################################################################

export const getCollectionDetails = async ({
  sharingContract,
  collectionId,
}: {
  sharingContract: DataProtectorSharing;
  collectionId: number;
}): Promise<Collection> => {
  const [collectionDetails, collectionOwnerResult] = await Promise.all([
    sharingContract.collectionDetails(collectionId),
    sharingContract.ownerOf(collectionId).catch(() => {
      return null; // Use null or a similar placeholder to indicate failure
    }),
  ]);

  if (!collectionOwnerResult) {
    throw new Error(
      `collectionId does not exist in the protectedDataSharing contract: ${collectionId}`
    );
  }

  return {
    collectionId,
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

  const [collectionDetails, userLatestSubscriptionExpiration] =
    await Promise.all([
      getCollectionDetails({
        sharingContract,
        collectionId: Number(protectedDataDetails.collection),
      }),
      sharingContract.getCollectionSubscriber(
        protectedDataDetails.collection,
        userAddress
      ),
    ]);

  return {
    addOnlyAppWhitelist: protectedDataDetails.addOnlyAppWhitelist,
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
      collectionId: Number(protectedDataDetails.collection),
      latestSubscriptionExpiration: Number(userLatestSubscriptionExpiration),
      ...collectionDetails,
    },
  };
};
