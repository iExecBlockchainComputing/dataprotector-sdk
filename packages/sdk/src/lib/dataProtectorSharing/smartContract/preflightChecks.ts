import { getBigInt } from 'ethers';
import { DataProtectorSharing } from '../../../../generated/typechain/sharing/DataProtectorSharing.js';
import { IRegistry } from '../../../../generated/typechain/sharing/interfaces/IRegistry.js';
import { AppWhitelist } from '../../../../generated/typechain/sharing/registry/AppWhitelist.js';
import { AppWhitelistRegistry } from '../../../../generated/typechain/sharing/registry/AppWhitelistRegistry.js';
import { ErrorWithData } from '../../../utils/errors.js';
import type {
  Address,
  Collection,
  ProtectedDataDetails,
} from '../../types/index.js';

// ---------------------Collection Modifier------------------------------------
export const onlyCollectionOperator = async ({
  sharingContract,
  collectionTokenId,
  userAddress,
}: {
  sharingContract: DataProtectorSharing;
  collectionTokenId: number;
  userAddress: Address;
}) => {
  // Fetch the owner of the token
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

  // Fetch the approved operator for the specific token
  const approvedOperator = await sharingContract
    .getApproved(collectionTokenId)
    .catch(() => {
      // Consider specific handling for custom errors if necessary
    });

  // Check if the operator is approved for all tokens of the owner
  const isApprovedForAll = await sharingContract
    .isApprovedForAll(ownerAddress, userAddress)
    .catch(() => {
      // Consider specific handling for custom errors if necessary
    });

  const isOwner = ownerAddress.toLowerCase() === userAddress.toLowerCase();
  const isApprovedOperator = approvedOperator
    ? approvedOperator.toLowerCase() === userAddress.toLowerCase()
    : false;
  const isOperatorApprovedForAll = isApprovedForAll === true;

  if (!isOwner && !isApprovedOperator && !isOperatorApprovedForAll) {
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
  sharingContract: DataProtectorSharing;
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
  collectionDetails: Collection
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

export const onlyCollectionEmpty = (collectionDetails: Collection) => {
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
    protectedDataDetails.latestRentalExpiration < currentTimestamp;

  const isNotInSubscribed =
    !protectedDataDetails.isInSubscription ||
    protectedDataDetails.collection.latestSubscriptionExpiration <
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
  sharingContract: DataProtectorSharing;
  userAddress: Address;
}) => {
  const balance = await sharingContract.earning(userAddress);

  if (balance === BigInt(0)) {
    throw new Error(`Your balance is empty: ${userAddress}`);
  }
};

// ---------------------AppWhitelist Modifier------------------------------------
export const onlyAppWhitelistRegistered = async ({
  appWhitelistRegistryContract,
  appWhitelist,
}: {
  appWhitelistRegistryContract: AppWhitelistRegistry;
  appWhitelist: Address;
}): Promise<string> => {
  const appWhitelistTokenId = getBigInt(appWhitelist).toString();
  return appWhitelistRegistryContract
    .ownerOf(appWhitelistTokenId)
    .catch(() => {
      throw new Error(
        `This whitelist contract ${appWhitelist} does not exist in the app whitelist registry.`
      );
    });
};

export const onlyAppWhitelistRegisteredAndManagedByOwner = async ({
  appWhitelistRegistryContract,
  appWhitelist,
  userAddress,
}: {
  appWhitelistRegistryContract: AppWhitelistRegistry;
  appWhitelist: Address;
  userAddress: Address;
}) => {
  const whitelistOwner = await onlyAppWhitelistRegistered({
    appWhitelistRegistryContract,
    appWhitelist,
  });
  if (whitelistOwner.toLowerCase() !== userAddress.toLowerCase()) {
    throw new Error(
      `This whitelist contract ${appWhitelist} is not owned by the wallet : ${userAddress}.`
    );
  }
};

export const onlyAppNotInAppWhitelist = async ({
  appWhitelistContract,
  app,
}: {
  appWhitelistContract: AppWhitelist;
  app: Address;
}) => {
  const isRegistered = await appWhitelistContract.isRegistered(app);
  if (isRegistered) {
    throw new Error(
      `This whitelist contract already have registered this app: ${app}.`
    );
  }
};

// if an app is in the AppWhitelist, it should be owned
// by the sharingContract
export const onlyAppInAppWhitelist = async ({
  appWhitelistContract,
  app,
}: {
  appWhitelistContract: AppWhitelist;
  app: Address;
}) => {
  // TODO: check is correct
  const isRegistered = await appWhitelistContract.isRegistered(app);
  if (!isRegistered) {
    throw new Error(
      `This whitelist contract does not have registered this app: ${app}.`
    );
  }
};

export const onlyAppOwnedBySharingContract = async ({
  sharingContractAddress,
  pocoAppRegistryContract,
  app,
}: {
  sharingContractAddress: Address;
  pocoAppRegistryContract: IRegistry;
  app: Address;
}) => {
  const appTokenId = getBigInt(app).toString();
  const appOwner = await pocoAppRegistryContract
    .ownerOf(appTokenId)
    .catch(() => {
      throw new Error('This app does not seem to exist or it has been burned.');
    });
  if (appOwner.toLowerCase() !== sharingContractAddress.toLowerCase()) {
    throw new Error('This app is not owned by the sharing contract.');
  }
};
