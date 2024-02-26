import { Contract } from 'ethers';
import { Address } from '../../types/index.js';

export const getCollectionForProtectedData = async ({
  sharingContract,
  protectedDataAddress,
}: { sharingContract: Contract } & {
  protectedDataAddress: Address;
}): Promise<number> => {
  return Number(
    (await sharingContract.protectedDataDetails(protectedDataAddress))[0]
  );
};

export const getSubscriptionParams = async ({
  sharingContract,
  collectionTokenId,
}: { sharingContract: Contract } & {
  collectionTokenId: number;
}) => {
  const subscriptionParams = (
    await sharingContract.collectionDetails(collectionTokenId)
  )[2];

  return {
    price: Number(subscriptionParams[0]),
    duration: Number(subscriptionParams[1]),
  };
};

export const getRentingParams = async ({
  sharingContract,
  protectedDataAddress,
}: { sharingContract: Contract } & {
  protectedDataAddress: Address;
}) => {
  const rentingParams = (
    await sharingContract.protectedDataDetails(protectedDataAddress)
  )[4];

  return {
    price: Number(rentingParams[0]),
    duration: Number(rentingParams[1]),
  };
};

export const getSellingParams = async ({
  sharingContract,
  protectedDataAddress,
}: { sharingContract: Contract } & {
  protectedDataAddress: Address;
}) => {
  const sellingParams = (
    await sharingContract.protectedDataDetails(protectedDataAddress)
  )[5];

  return {
    isForSale: sellingParams[0],
    price: Number(sellingParams[1]),
  };
};

export const getRenterExpiration = async ({
  sharingContract,
  protectedDataAddress,
  userAddress,
}: { sharingContract: Contract } & {
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
}: { sharingContract: Contract } & {
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
}: { sharingContract: Contract } & {
  protectedDataAddress: Address;
}): Promise<Address> => {
  return (await sharingContract.protectedDataDetails(protectedDataAddress))[1];
};
