import { ProtectedDataSharing } from '../../../../typechain/index.js';
import { ErrorWithData } from '../../../utils/errors.js';
import {
  Address,
  CollectionDetails,
  ProtectedDataDetails,
} from '../../types/index.js';

// ---------------------Collection Modifier------------------------------------
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
export const onlyProtectedDataNotInCollection = async ({
  sharingContract,
  protectedDataAddress,
}: {
  sharingContract: ProtectedDataSharing;
  protectedDataAddress: Address;
}) => {
  const protectedDataDetails = await sharingContract.protectedDataDetails(
    protectedDataAddress
  );

  if (protectedDataDetails.collection !== BigInt(0)) {
    throw new Error(
      `The protected data is already in a collection: ${protectedDataAddress}`
    );
  }
};

export const onlyCollectionNotMine = ({
  collectionOwner,
  userAddress,
}: {
  collectionOwner: Address;
  userAddress: Address;
}) => {
  if (userAddress === collectionOwner) {
    throw new ErrorWithData('This collection is yours.', {
      userAddress,
      collectionOwnerAddress: collectionOwner,
    });
  }
};

export const onlyCollectionNotSubscribed = (
  protectedDataDetails: ProtectedDataDetails
) => {
  const subscriptionExpiration =
    protectedDataDetails.collection.subscriptionExpiration;
  const currentTimestamp = Math.floor(Date.now() / 1000);

  if (subscriptionExpiration >= currentTimestamp) {
    throw new ErrorWithData('This collection has active subscriptions.', {
      protectedDataDetails,
    });
  }
};

export const onlyCollectionCurrentlyForSubscription = (
  collectionDetails: CollectionDetails
) => {
  if (collectionDetails.subscriptionParams.duration === 0) {
    throw new ErrorWithData(
      'This collection has no valid subscription params.',
      {
        collectionDetails,
      }
    );
  }
};

export const onlyCollectionNotCurrentlyForSubscription = (
  collectionDetails: CollectionDetails
) => {
  if (collectionDetails.subscriptionParams.duration !== 0) {
    throw new ErrorWithData(
      'This collection has no valid subscription params.',
      {
        collectionDetails,
      }
    );
  }
};

export const onlyCollectionEmpty = (collectionDetails: CollectionDetails) => {
  if (collectionDetails.size > 0) {
    throw new ErrorWithData(
      'Collection still has protected data. Please empty the collection first by calling removeFromCollection for each protected data.',
      {
        currentCollectionSize: collectionDetails.size,
      }
    );
  }
};

// ---------------------Subscription Modifier------------------------------------
export const onlyProtectedDataNotCurrentlyForSubscription = (
  protectedDataDetails: ProtectedDataDetails
) => {
  if (protectedDataDetails.inSubscription) {
    throw new ErrorWithData(
      'This protected data is currently included in your subscription. First call removeProtectedDataFromSubscription()',
      {
        protectedDataDetails,
      }
    );
  }
};

export const onlyProtectedDataCurrentlyForSubscription = (
  protectedDataDetails: ProtectedDataDetails
) => {
  if (!protectedDataDetails.inSubscription) {
    throw new ErrorWithData(
      'This protected data is not included in subscription.',
      {
        protectedDataDetails,
      }
    );
  }
};

// ---------------------Renting Modifier------------------------------------
export const onlyProtectedDataNotRented = (
  protectedDataDetails: ProtectedDataDetails
) => {
  const mostRecentRentalExpiration = protectedDataDetails?.rentalExpiration;
  const currentTimestamp = Math.floor(Date.now() / 1000);

  if (mostRecentRentalExpiration >= currentTimestamp) {
    throw new ErrorWithData('This protected data has active rentals.', {
      protectedDataDetails,
    });
  }
};

export const onlyProtectedDataCurrentlyForRent = (
  protectedDataDetails: ProtectedDataDetails
) => {
  if (protectedDataDetails.rentingParams.duration === 0) {
    throw new ErrorWithData(
      'This protected data is not available for renting.',
      {
        protectedDataDetails,
      }
    );
  }
};

export const onlyProtectedDataNotCurrentlyForRent = (
  protectedDataDetails: ProtectedDataDetails
) => {
  if (protectedDataDetails.rentingParams.duration > 0) {
    throw new ErrorWithData(
      'This protected data is currently for rent. First call removeProtectedDataFromRenting()',
      {
        protectedDataDetails,
      }
    );
  }
};

// ---------------------Sale Modifier------------------------------------
export const onlyProtectedDataNotCurrentlyForSale = (
  protectedDataDetails: ProtectedDataDetails
) => {
  if (protectedDataDetails.sellingParams.isForSale) {
    throw new ErrorWithData(
      'This protected data is currently available for sale. First call removeProtectedDataForSale()',
      {
        protectedDataDetails,
      }
    );
  }
};

export const onlyProtectedDataCurrentlyForSale = (
  protectedDataDetails: ProtectedDataDetails
) => {
  if (!protectedDataDetails.sellingParams.isForSale) {
    throw new ErrorWithData('This protected data is currently not for sale.', {
      protectedDataDetails,
    });
  }
};

// ---------------------Global Modifier------------------------------------
export const onlyProtectedDataAuthorizedToBeConsumed = (
  protectedDataDetails: ProtectedDataDetails
) => {
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const hasRentalExpired =
    protectedDataDetails.userRentalExpiration < currentTimestamp;

  const isNotInSubscribed =
    !protectedDataDetails.inSubscription ||
    protectedDataDetails.collection.userSubscriptionExpiration <
      currentTimestamp;

  if (hasRentalExpired && isNotInSubscribed) {
    throw new ErrorWithData(
      "You are not allowed to consume this protected data. You need to rent it first, or to subscribe to the user's collection.",
      {
        collectionId: protectedDataDetails.collection,
      }
    );
  }
};

export const onlyBalanceNotEmpty = async ({
  sharingContract,
  userAddress,
}: {
  sharingContract: ProtectedDataSharing;
  userAddress: Address;
}) => {
  const balance = await sharingContract.earning(userAddress);

  if (balance === BigInt(0)) {
    throw new Error(`Your balance is empty: ${userAddress}`);
  }
};
