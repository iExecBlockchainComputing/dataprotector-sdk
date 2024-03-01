import { z } from 'zod';
import type { Address } from '../../types/index.js';
import type { SharingContract } from './getSharingContract.js';

export type ProtectedDataDetails = {
  collectionTokenId: number;
  appAddress: Address;
  latestRentalExpiration: number;
  isIncludedInSubscription: boolean;
  rentingParams?: {
    priceInNRLC: number;
    durationInSeconds: number;
  };
  sellingParams: {
    isForSale: boolean;
    priceInNRLC: number;
  };
};

export const getProtectedDataDetails = async ({
  sharingContract,
  protectedDataAddress,
}: {
  sharingContract: SharingContract;
  protectedDataAddress: Address;
}): Promise<ProtectedDataDetails | undefined> => {
  const protectedDataDetails = await sharingContract.protectedDataDetails(
    protectedDataAddress
  );
  if (!protectedDataDetails) {
    return;
  }

  // Zod schema for ProtectedDataDetails struct
  const vProtectedDataDetails = z
    .tuple([
      z.bigint(), // 0: collectionTokenId
      z.string(), // 1: appAddress
      z.number(), // 2: latestRentalExpiration
      z.boolean(), // 3: isInSubscription
      z.tuple([
        // 4: rentingParams
        z.bigint(), // renting price in nRLC
        z.bigint(), // renting duration in seconds
      ]),
      z.tuple([
        // 5: sellingParams
        z.boolean(), // isForSale
        z.bigint(), // selling price in nRLC
      ]),
    ])
    .parse(protectedDataDetails);

  const rentingParams = vProtectedDataDetails[4];
  const rentingDurationInSeconds = Number(rentingParams[1]);
  const hasRentingParams = rentingDurationInSeconds !== 0;
  const sellingParams = vProtectedDataDetails[5];
  return {
    collectionTokenId: Number(vProtectedDataDetails[0]),
    appAddress: vProtectedDataDetails[1],
    latestRentalExpiration: vProtectedDataDetails[2],
    isIncludedInSubscription: vProtectedDataDetails[3],
    rentingParams: hasRentingParams
      ? {
          priceInNRLC: Number(rentingParams[0]),
          durationInSeconds: Number(rentingParams[1]),
        }
      : undefined,
    sellingParams: {
      isForSale: sellingParams[0],
      priceInNRLC: Number(sellingParams[1]),
    },
  };
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
