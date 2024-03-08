import { ProtectedDataSharing } from '../../../../typechain/sharing-smart-contract/artifacts/contracts/ProtectedDataSharing.js';
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
  errorMessage,
}: {
  collectionOwner: Address;
  userAddress: Address;
  errorMessage?: string;
}) => {
  if (userAddress === collectionOwner) {
    throw new ErrorWithData(errorMessage || 'This collection is yours.', {
      userAddress,
      collectionOwnerAddress: collectionOwner,
    });
  }
};

export const onlyCollectionNotSubscribed = (
  protectedDataDetails: ProtectedDataDetails
) => {
  const latestSubscriptionExpiration =
    protectedDataDetails.collection.latestSubscriptionExpiration;
  const currentTimestamp = Math.floor(Date.now() / 1000);

  if (latestSubscriptionExpiration >= currentTimestamp) {
    throw new ErrorWithData('This collection has active subscriptions.', {
      protectedDataDetails,
    });
  }
};

export const onlyCollectionAvailableForSubscription = (
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
export const onlyProtectedDataNotIncludedInSubscription = (
  protectedDataDetails: ProtectedDataDetails
) => {
  if (protectedDataDetails.isInSubscription) {
    throw new ErrorWithData(
      'This protected data is currently included in your subscription. First call removeProtectedDataFromSubscription()',
      {
        protectedDataDetails,
      }
    );
  }
};

export const onlyProtectedDataIncludedInSubscription = (
  protectedDataDetails: ProtectedDataDetails
) => {
  if (!protectedDataDetails.isInSubscription) {
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
  const latestRentalExpiration = protectedDataDetails?.latestRentalExpiration;
  const currentTimestamp = Math.floor(Date.now() / 1000);

  if (latestRentalExpiration >= currentTimestamp) {
    throw new ErrorWithData('This protected data has active rentals.', {
      protectedDataDetails,
    });
  }
};

export const onlyProtectedDataCurrentlyForRent = (
  protectedDataDetails: ProtectedDataDetails
) => {
  if (!protectedDataDetails.rentingParams.isForRent) {
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
  if (protectedDataDetails.rentingParams.isForRent) {
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
    protectedDataDetails.userLatestRentalExpiration < currentTimestamp;

  const isNotInSubscribed =
    !protectedDataDetails.isInSubscription ||
    protectedDataDetails.collection.userLatestSubscriptionExpiration <
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
