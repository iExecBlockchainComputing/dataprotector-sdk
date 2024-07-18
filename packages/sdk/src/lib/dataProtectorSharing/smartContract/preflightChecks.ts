import { ethers, getBigInt } from 'ethers';
import type { DataProtectorSharing } from '../../../../generated/typechain/sharing/DataProtectorSharing.js';
import type { IRegistry } from '../../../../generated/typechain/sharing/interfaces/IRegistry.js';
import type { AddOnlyAppWhitelist } from '../../../../generated/typechain/sharing/registry/AddOnlyAppWhitelist.js';
import type { AddOnlyAppWhitelistRegistry } from '../../../../generated/typechain/sharing/registry/AddOnlyAppWhitelistRegistry.js';
import { ErrorWithData } from '../../../utils/errors.js';
import type {
  Address,
  Collection,
  ProtectedDataDetails,
  RentingParams,
  SubscriptionParams,
} from '../../types/index.js';

// ---------------------Collection Modifier------------------------------------
export const onlyCollectionOperator = async ({
  sharingContract,
  collectionId,
  userAddress,
}: {
  sharingContract: DataProtectorSharing;
  collectionId: number;
  userAddress: Address;
}) => {
  // Fetch the owner of the token and get approved operator in parallel
  const [ownerAddress, approvedOperator] = await Promise.all([
    sharingContract.ownerOf(collectionId).catch(() => {
      throw new ErrorWithData(
        'This collection does not seem to exist or it has been burned.',
        {
          collectionId,
        }
      );
    }),
    sharingContract.getApproved(collectionId).catch(() => {
      return null; // Return null if collectionId doesn't exist
    }),
  ]);

  // Check if the operator is approved for all tokens of the owner
  const isApprovedForAll = await sharingContract
    .isApprovedForAll(ownerAddress, userAddress)
    .catch(() => {
      return null;
    });

  // Perform checks
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
  protectedData,
}: {
  sharingContract: DataProtectorSharing;
  protectedData: Address;
}) => {
  const protectedDataDetails = await sharingContract.protectedDataDetails(
    protectedData
  );

  if (protectedDataDetails.collection !== BigInt(0)) {
    throw new Error(
      `The protected data is already in a collection: ${protectedData}`
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

export const onlyValidSubscriptionParams = (
  expectedSubscriptionParams: SubscriptionParams,
  currentSubscriptionParams: SubscriptionParams
) => {
  if (
    expectedSubscriptionParams.duration !==
      currentSubscriptionParams.duration ||
    expectedSubscriptionParams.price !== currentSubscriptionParams.price
  ) {
    throw new ErrorWithData(
      'The given duration and price params do not correspond to the current subscription params of the collection',
      { expectedSubscriptionParams, currentSubscriptionParams }
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

export const onlyValidRentingParams = (
  expectedRentingParams: RentingParams,
  currentRentingParams: RentingParams
) => {
  if (
    expectedRentingParams.duration !== currentRentingParams.duration ||
    expectedRentingParams.price !== currentRentingParams.price
  ) {
    throw new ErrorWithData(
      'The given price and duration params do not correspond to the current renting params of the protected data',
      { expectedRentingParams, currentRentingParams }
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

export const onlyValidSellingParams = (
  expectedPrice: number,
  currentPrice: number
) => {
  if (expectedPrice !== currentPrice) {
    throw new ErrorWithData(
      'The given price param does not correspond to the current sale price of the protected data',
      { expectedPrice, currentPrice }
    );
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
  addOnlyAppWhitelistRegistryContract,
  addOnlyAppWhitelist,
}: {
  addOnlyAppWhitelistRegistryContract: AddOnlyAppWhitelistRegistry;
  addOnlyAppWhitelist: Address;
}): Promise<string> => {
  const appWhitelistTokenId = getBigInt(addOnlyAppWhitelist).toString();
  return addOnlyAppWhitelistRegistryContract
    .ownerOf(appWhitelistTokenId)
    .catch(() => {
      throw new Error(
        `This whitelist contract ${addOnlyAppWhitelist} does not exist in the app whitelist registry.`
      );
    });
};

export const onlyAppWhitelistRegisteredAndManagedByOwner = async ({
  addOnlyAppWhitelistRegistryContract,
  addOnlyAppWhitelist,
  userAddress,
}: {
  addOnlyAppWhitelistRegistryContract: AddOnlyAppWhitelistRegistry;
  addOnlyAppWhitelist: Address;
  userAddress: Address;
}) => {
  const whitelistOwner = await onlyAppWhitelistRegistered({
    addOnlyAppWhitelistRegistryContract,
    addOnlyAppWhitelist,
  });
  if (whitelistOwner.toLowerCase() !== userAddress.toLowerCase()) {
    throw new Error(
      `This whitelist contract ${addOnlyAppWhitelist} is not owned by the wallet: ${userAddress}.`
    );
  }
};

export const onlyAppNotInAppWhitelist = async ({
  addOnlyAppWhitelistContract,
  app,
}: {
  addOnlyAppWhitelistContract: AddOnlyAppWhitelist;
  app: Address;
}) => {
  const isRegistered = await addOnlyAppWhitelistContract.isRegistered(app);
  if (isRegistered) {
    throw new Error(
      `This whitelist contract already have registered this app: ${app}.`
    );
  }
};

// if an app is in the AppWhitelist, it should be owned
// by the sharingContract
export const onlyAppInAddOnlyAppWhitelist = async ({
  addOnlyAppWhitelistContract,
  app,
}: {
  addOnlyAppWhitelistContract: AddOnlyAppWhitelist;
  app: Address;
}) => {
  const isRegistered = await addOnlyAppWhitelistContract.isRegistered(app);
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

// ---------------------Account checks------------------------------------

export const onlyAccountWithMinimumBalance = ({
  accountDetails,
  minimumBalance,
}: {
  accountDetails: { balance: bigint };
  minimumBalance: ethers.BigNumberish;
}) => {
  const requiredBalance = BigInt(minimumBalance);
  if (accountDetails.balance < requiredBalance) {
    throw new Error(
      'Not enough xRLC in your iExec account. You may have xRLC in your wallet but to interact with the iExec protocol, you need to deposit some xRLC into your iExec account.'
    );
  }
};
