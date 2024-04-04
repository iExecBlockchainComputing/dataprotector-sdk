import { Address, AddressOrENS, OnStatusUpdateFn } from './commonTypes.js';
import type { CollectionSubscription } from './graphQLTypes.js';

/***************************************************************************
 *                        Sharing Types                                    *
 ***************************************************************************/
export type ProtectedDataDetails = {
  collection: Collection;
  appWhitelist: string;
  latestRentalExpiration: number;
  isInSubscription: boolean;
  rentingParams: {
    isForRent: boolean;
    price: number;
    duration: number;
  };
  sellingParams: {
    isForSale: boolean;
    price: number;
  };
};

export type ProtectedDataInCollection = {
  id: AddressOrENS;
  name: string;
  creationTimestamp: number;
  owner: { id: AddressOrENS };
  collection: { id: number; owner: { id: string } };
  isRentable: boolean;
  rentalParams?: {
    price: number; // price in nRLC
    duration: number; // duration in seconds
  };
  rentals: Array<{
    renter: string; // Address
  }>;
  isForSale: boolean;
  saleParams?: {
    price: number; // price in nRLC
  };
  isIncludedInSubscription: boolean;
};

export type GetProtectedDataInCollectionsResponse = {
  protectedDataInCollection: ProtectedDataInCollection[];
};

export type SharingContractConsumer = {
  sharingContractAddress: AddressOrENS;
};

export type SuccessWithTransactionHash = {
  txHash: string;
};

export type GetProtectedDataPricingParams = {
  protectedDataAddress: AddressOrENS;
};

export type GetProtectedDataPricingParamsResponse = {
  protectedDataPricingParams: {
    address: Address;
    name: string;
    isRentable: boolean;
    isIncludedInSubscription: boolean;
    isForSale: boolean;
    collection?: {
      subscriptionParams?: {
        price: number;
        duration: number;
      };
    };
    rentalParam?: {
      price: number;
      duration: number;
    };
  };
};

export type ConsumeProtectedDataStatuses =
  | 'CONSUME_PROTECTED_DATA'
  | 'UPLOAD_RESULT_TO_IPFS';

export type ConsumeProtectedDataParams = {
  protectedDataAddress: AddressOrENS;
  app?: AddressOrENS;
  onStatusUpdate?: OnStatusUpdateFn<ConsumeProtectedDataStatuses>;
};

export type ConsumeProtectedDataResponse = {
  txHash: string;
  dealId: string;
  ipfsLink: string;
  privateKey: CryptoKey;
};

// ---------------------Collection Types------------------------------------

export type Collection = {
  collectionTokenId: number;
  collectionOwner: Address;
  size: number;
  latestSubscriptionExpiration: number;
  subscriptionParams: { price: number; duration: number };
};

export type CollectionOwner = {
  id: Address;
  collections: Array<{
    id: Address;
    creationTimestamp: number;
    subscriptionParams: {
      price: number;
      duration: number;
    };
  }>;
};

export type GetCollectionOwnersParams = {
  limit?: number;
};

export type GetCollectionOwnersResponse = {
  collectionOwners: CollectionOwner[];
};

export type RemoveCollectionParams = {
  collectionTokenId: number;
};

export type CreateCollectionResponse = {
  collectionTokenId: number;
  txHash: string;
};

export type AddToCollectionStatuses =
  | 'APPROVE_COLLECTION_CONTRACT'
  | 'ADD_PROTECTED_DATA_TO_COLLECTION';

export type AddToCollectionParams = {
  collectionTokenId: number;
  protectedDataAddress: AddressOrENS;
  appWhitelist?: Address;
  onStatusUpdate?: OnStatusUpdateFn<AddToCollectionStatuses>;
};

export type RemoveFromCollectionParams = {
  protectedDataAddress: AddressOrENS;
};

export type GetCollectionsByOwnerParams = {
  ownerAddress: AddressOrENS;
  includeHiddenProtectedDatas?: boolean;
};

export type GetCollectionsByOwnerResponse = {
  collections: CollectionWithProtectedDatas[];
};

export type CollectionWithProtectedDatas = {
  id: number;
  creationTimestamp: number;
  protectedDatas: ProtectedDataInCollection[];
  subscriptionParams?: {
    price: number;
    duration: number;
  };
  subscriptions: Array<{
    subscriber: {
      id: Address;
    };
    endDate: number;
  }>;
};

export type GetProtectedDataInCollectionsParams = {
  protectedDataAddress?: Address;
  collectionTokenId?: number;
  collectionOwner?: AddressOrENS;
  createdAfterTimestamp?: number;
  isRentable?: true;
  isForSale?: true;
  page?: number;
  pageSize?: number;
};

// ---------------------Subscription Types------------------------------------
export type SetProtectedDataToSubscriptionParams = {
  protectedDataAddress: AddressOrENS;
};

export type SetSubscriptionParams = {
  collectionTokenId: number;
  priceInNRLC: number;
  durationInSeconds: number;
};

export type GetCollectionSubscriptionsResponse = {
  collectionSubscriptions: CollectionSubscription[];
};

export type GetCollectionSubscriptionsParams = {
  subscriberAddress?: AddressOrENS;
  collectionTokenId?: number;
  includePastSubscriptions?: boolean;
};

export type GetSubscribersParams = {
  collectionTokenId: number;
};

export type RemoveProtectedDataFromSubscriptionParams = {
  protectedDataAddress: AddressOrENS;
};

export type SubscribeToCollectionParams = {
  collectionTokenId: number;
  duration: number;
};

// ---------------------Rental Types------------------------------------
export type SetProtectedDataToRentingParams = {
  protectedDataAddress: AddressOrENS;
  priceInNRLC: number;
  durationInSeconds: number;
};

export type RemoveProtectedDataFromRentingParams = {
  protectedDataAddress: AddressOrENS;
};

export type RentProtectedDataParams = {
  protectedDataAddress: AddressOrENS;
};

export type ProtectedDataRental = {
  id: string;
  renter: Address;
  protectedData: {
    id: AddressOrENS;
    name: string;
  };
  creationTimestamp: number;
  endDate: number;
  rentalParams: {
    price: number;
    duration: number;
  };
};

export type GetRentalsParams = {
  renterAddress?: AddressOrENS;
  protectedDataAddress?: AddressOrENS;
  includePastRentals?: boolean;
};

export type GetRentalsResponse = {
  rentals: ProtectedDataRental[];
};

// ---------------------Sell Types------------------------------------
export type SetProtectedDataForSaleParams = {
  protectedDataAddress: AddressOrENS;
  priceInNRLC: number;
};

export type RemoveProtectedDataForSaleParams = {
  protectedDataAddress: AddressOrENS;
};

export type BuyProtectedDataParams = {
  protectedDataAddress: AddressOrENS;
  collectionTokenIdTo?: number;
  appAddress?: AddressOrENS;
};

// ---------------------AppWhitelist Types------------------------------------
export type AddAppToAppWhitelistParams = {
  appWhitelist: Address;
  app: AddressOrENS;
};

export type CreateAppWhitelistResponse = {
  appWhitelist: Address;
  txHash: string;
};

export type GetUserAppWhitelistParams = {
  user?: AddressOrENS;
};

export type GetUserAppWhitelistResponse = {
  appWhitelists: AppWhitelist[];
};

export type AppWhitelist = {
  address: string;
  owner: string;
  app: Array<{
    address: string;
  }>;
};
