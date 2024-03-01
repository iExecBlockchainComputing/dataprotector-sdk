import { ProtectedDataSharing } from '../../../../typechain/index.js';
import { getCurrentTimestamp } from '../../../utils/blockchain.js';
import { ErrorWithData } from '../../../utils/errors.js';
import { Address } from '../../types/index.js';
import { getSellingParams } from './sharingContract.reads.js';

export const onlyCollectionOperator = async ({
  sharingContract,
  collectionTokenId,
  userAddress,
}: { sharingContract: ProtectedDataSharing } & {
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

  const isOwner = ownerAddress.toLowerCase() === userAddress.toLowerCase();
  const isApprovedOperator = approvedOperator
    ? approvedOperator.toLowerCase() === userAddress.toLowerCase()
    : false;

  if (!isOwner && !isApprovedOperator) {
    throw new ErrorWithData("This collection can't be managed by you.", {
      userAddress,
      collectionOwnerAddress: ownerAddress,
    });
  }
};

export const onlyCollectionNotMine = async ({
  sharingContract,
  collectionTokenId,
  userAddress,
}: { sharingContract: ProtectedDataSharing } & {
  collectionTokenId: number;
  userAddress: Address;
}) => {
  let collectionOwner = await sharingContract.ownerOf(collectionTokenId);
  collectionOwner = collectionOwner.toLowerCase();
  if (userAddress === collectionOwner) {
    throw new ErrorWithData('This collection is yours.', {
      userAddress,
      collectionOwnerAddress: collectionOwner,
    });
  }
};

export const onlyCollectionNotSubscribed = async ({
  sharingContract,
  collectionTokenId,
}: { sharingContract: ProtectedDataSharing } & {
  collectionTokenId: number;
}) => {
  const collectionDetails = await sharingContract.collectionDetails(
    collectionTokenId
  );
  const subscriptionExpiration = Number(collectionDetails?.[1]);
  const currentTimestamp = await getCurrentTimestamp(sharingContract);

  if (subscriptionExpiration >= currentTimestamp) {
    throw new ErrorWithData('This collection has active subscriptions.', {
      collectionTokenId,
    });
  }
};

export const onlyProtectedDataNotRented = async ({
  sharingContract,
  protectedDataAddress,
}: { sharingContract: ProtectedDataSharing } & {
  protectedDataAddress: Address;
}) => {
  const protectedDataDetails = await sharingContract.protectedDataDetails(
    protectedDataAddress
  );
  const mostRecentRentalExpiration = Number(protectedDataDetails?.[2]);
  const currentTimestamp = await getCurrentTimestamp(sharingContract);
  if (mostRecentRentalExpiration >= currentTimestamp) {
    throw new ErrorWithData('This protected data has active rentals.', {
      protectedDataAddress,
    });
  }
};

export const onlyProtectedDataNotForSale = async ({
  sharingContract,
  protectedDataAddress,
}: { sharingContract: ProtectedDataSharing } & {
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
}: { sharingContract: ProtectedDataSharing } & {
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
