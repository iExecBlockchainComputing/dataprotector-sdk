import {
  IRental,
  ISale,
  ISubscription,
  ProtectedDataSharing,
} from '../../../../typechain/index.js';
import { Address } from '../../types/index.js';

export const getCollectionForProtectedData = async ({
  sharingContract,
  protectedDataAddress,
}: { sharingContract: ProtectedDataSharing } & {
  protectedDataAddress: Address;
}): Promise<bigint> => {
  const protectedDataDetails = await sharingContract.protectedDataDetails(
    protectedDataAddress
  );
  if (!protectedDataDetails) {
    throw new Error(
      `ProtectedData does not exist in the protectedDataSharing contract: ${protectedDataAddress}`
    );
  }
  return protectedDataDetails.collection;
};

export const getSubscriptionParams = async ({
  sharingContract,
  collectionTokenId,
}: {
  sharingContract: ProtectedDataSharing;
  collectionTokenId: bigint;
}): Promise<ISubscription.SubscriptionParamsStructOutput> => {
  const collectionDetails = await sharingContract.collectionDetails(
    collectionTokenId
  );

  if (!collectionDetails) {
    throw new Error(
      `Collection details not found for token ID: ${collectionTokenId}`
    );
  }

  const { subscriptionParams } = collectionDetails;
  if (!subscriptionParams) {
    throw new Error(
      `Subscription parameters not found for collection token ID: ${collectionTokenId}`
    );
  }

  return subscriptionParams;
};

export const getCollectionSize = async ({
  sharingContract,
  collectionTokenId,
}: { sharingContract: ProtectedDataSharing } & {
  collectionTokenId: bigint;
}) => {
  const { size } = await sharingContract.collectionDetails(collectionTokenId);
  return Number(size);
};

export const getRentingParams = async ({
  sharingContract,
  protectedDataAddress,
}: {
  sharingContract: ProtectedDataSharing;
  protectedDataAddress: Address;
}): Promise<IRental.RentingParamsStructOutput> => {
  const protectedDataDetails = await sharingContract.protectedDataDetails(
    protectedDataAddress
  );

  if (!protectedDataDetails) {
    throw new Error(
      `ProtectedData details not found for address: ${protectedDataDetails}`
    );
  }

  if (!protectedDataDetails.rentingParams) {
    throw new Error(
      `Renting parameters not found for ProtectedData address: ${protectedDataAddress}`
    );
  }

  const { rentingParams } = protectedDataDetails;
  return rentingParams;
};

export const getSellingParams = async ({
  sharingContract,
  protectedDataAddress,
}: {
  sharingContract: ProtectedDataSharing;
  protectedDataAddress: Address;
}): Promise<ISale.SellingParamsStructOutput> => {
  const protectedDataDetails = await sharingContract.protectedDataDetails(
    protectedDataAddress
  );

  if (!protectedDataDetails) {
    throw new Error(
      `ProtectedData details not found for address: ${protectedDataDetails}`
    );
  }

  if (!protectedDataDetails.sellingParams) {
    throw new Error(
      `Selling parameters not found for ProtectedData address: ${protectedDataAddress}`
    );
  }

  const { sellingParams } = protectedDataDetails;
  return sellingParams;
};

export const getRentalExpiration = async ({
  sharingContract,
  protectedDataAddress,
  userAddress,
}: { sharingContract: ProtectedDataSharing } & {
  protectedDataAddress: Address;
  userAddress: Address;
}): Promise<bigint> => {
  return sharingContract.getProtectedDataRenter(
    protectedDataAddress,
    userAddress
  );
};

export const getSubscriberExpiration = async ({
  sharingContract,
  collectionTokenId,
  userAddress,
}: { sharingContract: ProtectedDataSharing } & {
  collectionTokenId: bigint;
  userAddress: Address;
}): Promise<bigint> => {
  return sharingContract.getCollectionSubscriber(
    collectionTokenId,
    userAddress
  );
};

export const getAppToConsumeProtectedData = async ({
  sharingContract,
  protectedDataAddress,
}: { sharingContract: ProtectedDataSharing } & {
  protectedDataAddress: Address;
}): Promise<Address> => {
  const { app } = await sharingContract.protectedDataDetails(
    protectedDataAddress
  );
  return app;
};

export const isIncludedInSubscription = async ({
  sharingContract,
  protectedDataAddress,
}: { sharingContract: ProtectedDataSharing } & {
  protectedDataAddress: Address;
}): Promise<boolean> => {
  const { inSubscription } = await sharingContract.protectedDataDetails(
    protectedDataAddress
  );
  return inSubscription;
};
