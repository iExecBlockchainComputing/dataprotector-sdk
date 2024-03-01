import { z } from 'zod';
import type { Address } from '../../types/index.js';
import type { SharingContract } from './getSharingContract.js';

export const getCollectionForProtectedData = async ({
  sharingContract,
  protectedDataAddress,
}: { sharingContract: SharingContract } & {
  protectedDataAddress: Address;
}): Promise<number | undefined> => {
  const protectedDataDetails = await sharingContract.protectedDataDetails(
    protectedDataAddress
  );
  if (!protectedDataDetails) {
    return;
  }
  console.log('protectedDataDetails', protectedDataDetails);
  const vProtectedDataDetails = z
    .tuple([
      z.bigint(), // collectionTokenId
      z.string(), // appAddress
    ])
    .parse(protectedDataDetails);
  return Number(vProtectedDataDetails[0]);
};

export const getCollectionDetails = async ({
  sharingContract,
  collectionTokenId,
}: { sharingContract: SharingContract } & {
  collectionTokenId: number;
}) => {
  const collectionDetails = await sharingContract.collectionDetails(
    collectionTokenId
  );
  if (!collectionDetails) {
    return;
  }

  // Zod schema for CollectionDetails struct
  const vCollectionDetails = z
    .tuple([
      z.bigint(), // collectionSize, ie. number of protected data
      z.bigint(), // lastSubscriptionExpirationTimestamp
      z.tuple([
        z.bigint(), // subscription price in nRLC
        z.bigint(), // subscription duration in seconds
      ]),
    ])
    .parse(collectionDetails);

  const subscriptionParams = vCollectionDetails[2];
  const durationInSeconds = Number(subscriptionParams[1]);
  const hasSubscriptionParams = durationInSeconds !== 0;
  return {
    collectionSize: Number(vCollectionDetails[0]),
    lastSubscriptionExpirationTimestamp: Number(vCollectionDetails[1]),
    subscriptionParams: hasSubscriptionParams && {
      priceInNRLC: Number(subscriptionParams[0]),
      durationInSeconds,
    },
  };
};

export const getRentingParams = async ({
  sharingContract,
  protectedDataAddress,
}: { sharingContract: SharingContract } & {
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
}: { sharingContract: SharingContract } & {
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
}: { sharingContract: SharingContract } & {
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
}: { sharingContract: SharingContract } & {
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
}: { sharingContract: SharingContract } & {
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
}: { sharingContract: SharingContract } & {
  protectedDataAddress: Address;
}): Promise<boolean> => {
  const protectedDataDetails = await sharingContract.protectedDataDetails(
    protectedDataAddress
  );
  return protectedDataDetails?.[3];
};
