import { ProtectedDataSharing } from '../../../../typechain/index.js';
import { Address } from '../../types/index.js';

export const getCollectionForProtectedData = async ({
  sharingContract,
  protectedDataAddress,
}: { sharingContract: ProtectedDataSharing } & {
  protectedDataAddress: Address;
}): Promise<number> => {
  const protectedDataDetails = await sharingContract.protectedDataDetails(
    protectedDataAddress
  );
  if (!protectedDataDetails) {
    return;
  }
  return Number(protectedDataDetails[0]);
};

export const getSubscriptionParams = async ({
  sharingContract,
  collectionTokenId,
}: { sharingContract: ProtectedDataSharing } & {
  collectionTokenId: number;
}): Promise<{ price: number | null; duration: number | null }> => {
  const collectionDetails = await sharingContract.collectionDetails(
    collectionTokenId
  );
  if (!collectionDetails) {
    return {
      price: null,
      duration: null,
    };
  }

  const subscriptionParams = collectionDetails[2];
  if (!subscriptionParams) {
    return {
      price: null,
      duration: null,
    };
  }

  return {
    price: Number(subscriptionParams[0]),
    duration: Number(subscriptionParams[1]),
  };
};

export const getCollectionSize = async ({
  sharingContract,
  collectionTokenId,
}: { sharingContract: ProtectedDataSharing } & {
  collectionTokenId: number;
}) => {
  const collectionDetails = await sharingContract.collectionDetails(
    collectionTokenId
  );
  return Number(collectionDetails?.[0]);
};

export const getRentingParams = async ({
  sharingContract,
  protectedDataAddress,
}: { sharingContract: ProtectedDataSharing } & {
  protectedDataAddress: Address;
}) => {
  const protectedDataDetails = await sharingContract.protectedDataDetails(
    protectedDataAddress
  );

  const rentingParams = protectedDataDetails[4];
  if (!rentingParams) {
    return {
      price: null,
      duration: null,
    };
  }

  return {
    price: Number(rentingParams[0]),
    duration: Number(rentingParams[1]),
  };
};

export const getSellingParams = async ({
  sharingContract,
  protectedDataAddress,
}: { sharingContract: ProtectedDataSharing } & {
  protectedDataAddress: Address;
}) => {
  const protectedDataDetails = await sharingContract.protectedDataDetails(
    protectedDataAddress
  );

  const sellingParams = protectedDataDetails[5];
  if (!sellingParams) {
    return {
      isForSale: null,
      price: null,
    };
  }

  return {
    isForSale: sellingParams[0],
    price: Number(sellingParams[1]),
  };
};

export const getRentalExpiration = async ({
  sharingContract,
  protectedDataAddress,
  userAddress,
}: { sharingContract: ProtectedDataSharing } & {
  protectedDataAddress: Address;
  userAddress: Address;
}): Promise<number> => {
  const expirationTimestamp = await sharingContract.getProtectedDataRenter(
    protectedDataAddress,
    userAddress
  );
  return Number(expirationTimestamp);
};

export const getSubscriberExpiration = async ({
  sharingContract,
  collectionTokenId,
  userAddress,
}: { sharingContract: ProtectedDataSharing } & {
  collectionTokenId: number;
  userAddress: Address;
}): Promise<number> => {
  const expirationTimestamp = await sharingContract.getCollectionSubscriber(
    collectionTokenId,
    userAddress
  );

  return Number(expirationTimestamp);
};

export const getAppToConsumeProtectedData = async ({
  sharingContract,
  protectedDataAddress,
}: { sharingContract: ProtectedDataSharing } & {
  protectedDataAddress: Address;
}): Promise<Address> => {
  const protectedDataDetails = await sharingContract.protectedDataDetails(
    protectedDataAddress
  );
  return protectedDataDetails?.[1];
};

export const isIncludedInSubscription = async ({
  sharingContract,
  protectedDataAddress,
}: { sharingContract: ProtectedDataSharing } & {
  protectedDataAddress: Address;
}): Promise<boolean> => {
  const protectedDataDetails = await sharingContract.protectedDataDetails(
    protectedDataAddress
  );
  return protectedDataDetails?.[3];
};
