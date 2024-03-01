import { ProtectedDataSharing } from '../../../../typechain/index.js';
import { ErrorWithData } from '../../../utils/errors.js';
import {
  Address,
  CollectionDetails,
  ProtectedDataDetails,
} from '../../types/index.js';
import { getSellingParams } from './sharingContract.reads.js';

export const onlyCollectionOperator = async ({
  sharingContract,
  collectionTokenId,
  userAddress,
}: {
  sharingContract: ProtectedDataSharing;
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
}: {
  sharingContract: ProtectedDataSharing;
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

export const onlyCollectionNotSubscribed = (
  collectionDetails: CollectionDetails
) => {
  const subscriptionExpiration = Number(
    collectionDetails?.subscriptionExpiration
  );
  const currentTimestamp = Math.floor(Date.now() / 1000);

  if (subscriptionExpiration >= currentTimestamp) {
    throw new ErrorWithData('This collection has active subscriptions.', {
      collectionDetails,
    });
  }
};

export const onlyProtectedDataNotRented = (
  protectedDataDetails: ProtectedDataDetails
) => {
  const mostRecentRentalExpiration = Number(
    protectedDataDetails?.rentalExpiration
  );
  const currentTimestamp = Math.floor(Date.now() / 1000);

  if (mostRecentRentalExpiration >= currentTimestamp) {
    throw new ErrorWithData('This protected data has active rentals.', {
      protectedDataDetails,
    });
  }
};

export const onlyProtectedDataNotForSale = (
  protectedDataDetails: ProtectedDataDetails
) => {
  const sellingParams = getSellingParams(protectedDataDetails);

  if (sellingParams.isForSale) {
    throw new ErrorWithData(
      'This protected data is currently available for sale. First call removeProtectedDataForSale()',
      {
        protectedDataDetails,
      }
    );
  }
};

export const onlyProtectedDataForSale = (
  protectedDataDetails: ProtectedDataDetails
) => {
  const sellingParams = getSellingParams(protectedDataDetails);

  if (!sellingParams.isForSale) {
    throw new ErrorWithData('This protected data is currently not for sale.', {
      protectedDataDetails,
    });
  }
};
