import { Contract } from 'ethers';
import { ErrorWithData } from '../../../utils/errors.js';
import { Address } from '../../types/index.js';
import {
  getCollectionForProtectedData,
  getSellingParams,
} from './getterForSharingContract.js';

export const onlyCollectionOperator = async ({
  sharingContract,
  collectionTokenId,
  userAddress,
}: { sharingContract: Contract } & {
  collectionTokenId: number;
  userAddress: Address;
}) => {
  const ownerAddress = await sharingContract
    .ownerOf(collectionTokenId)
    .catch(() => {
      throw new ErrorWithData(
        'This collection does not seem to exist or it has been burned.',
        {
          collectionTokenId,
        }
      );
    });

  const approvedOperator = await sharingContract
    .getApproved(collectionTokenId)
    .catch(() => {
      //TODO: check if there is other custom error
    });

  if (
    ownerAddress.toLowerCase() !== userAddress &&
    approvedOperator.toLowerCase() !== userAddress
  ) {
    throw new ErrorWithData("This collection can't be managed by you.", {
      userAddress,
      collectionOwnerAddress: ownerAddress,
    });
  }
};

export const onlyProtectedDataInCollection = async ({
  sharingContract,
  protectedDataAddress,
}: { sharingContract: Contract } & {
  protectedDataAddress: Address;
}) => {
  const collectionTokenId = await getCollectionForProtectedData({
    sharingContract,
    protectedDataAddress,
  });

  if (collectionTokenId === 0) {
    throw new ErrorWithData(
      'This protected data is not part of a collection.',
      { protectedDataAddress }
    );
  }
};

export const onlyCollectionNotSubscribed = async ({
  sharingContract,
  collectionTokenId,
}: { sharingContract: Contract } & {
  collectionTokenId: number;
}) => {
  const subscriptionExpiration = Number(
    (await sharingContract.collectionDetails(collectionTokenId))[1]
  );
  const provider = sharingContract.runner.provider;
  const currentBlock = await provider.getBlockNumber();
  const currentTimestamp = (await provider.getBlock(currentBlock)).timestamp;
  if (subscriptionExpiration >= currentTimestamp) {
    throw new ErrorWithData('This collection has active subscriptions.', {
      collectionTokenId,
    });
  }
};

export const onlyProtectedDataNotRented = async ({
  sharingContract,
  protectedDataAddress,
}: { sharingContract: Contract } & {
  protectedDataAddress: Address;
}) => {
  const rentalExpiration = Number(
    (await sharingContract.protectedDataDetails(protectedDataAddress))[2]
  );

  const provider = sharingContract.runner.provider;
  const currentBlock = await provider.getBlockNumber();
  const currentTimestamp = (await provider.getBlock(currentBlock)).timestamp;
  if (rentalExpiration >= currentTimestamp) {
    throw new ErrorWithData('This protected data has active rentals.', {
      protectedDataAddress,
    });
  }
};

export const onlyProtectedDataNotForSale = async ({
  sharingContract,
  protectedDataAddress,
}: { sharingContract: Contract } & {
  protectedDataAddress: Address;
}) => {
  const sellingParams = await getSellingParams({
    sharingContract,
    protectedDataAddress,
  });

  if (sellingParams.isForSale) {
    throw new ErrorWithData(
      'This protected data is currently available for sale. First call removeProtectedDataForSale()',
      {
        protectedDataAddress,
      }
    );
  }
};

export const onlyProtectedDataForSale = async ({
  sharingContract,
  protectedDataAddress,
}: { sharingContract: Contract } & {
  protectedDataAddress: Address;
}) => {
  const sellingParams = await getSellingParams({
    sharingContract,
    protectedDataAddress,
  });

  if (!sellingParams.isForSale) {
    throw new ErrorWithData('This protected data is currently not for sale.', {
      protectedDataAddress,
    });
  }
};