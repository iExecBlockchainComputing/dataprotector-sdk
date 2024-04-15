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
  protectedData: AddressOrENS;
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
  | 'CONSUME_ORDER_REQUESTED'
  | 'CONSUME_TASK_ACTIVE'
  | 'CONSUME_TASK_ERROR'
  | 'CONSUME_TASK_COMPLETED'
  | 'CONSUME_RESULT_DOWNLOAD'
  | 'CONSUME_RESULT_DECRYPT'
  | 'CONSUME_RESULT_COMPLETE';

export type ConsumeProtectedDataParams = {
  protectedData: AddressOrENS;
  app?: AddressOrENS;
  workerpool?: AddressOrENS;
  onStatusUpdate?: OnStatusUpdateFn<ConsumeProtectedDataStatuses>;
};

export type ConsumeProtectedDataResponse = {
  txHash: string;
  dealId: string;
  resultZipFile: string;
};

// ---------------------Collection Types------------------------------------

export type Collection = {
  collectionId: number;
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
  collectionId: number;
};

export type CreateCollectionResponse = {
  collectionId: number;
  txHash: string;
};

export type AddToCollectionStatuses =
  | 'APPROVE_COLLECTION_CONTRACT'
  | 'ADD_PROTECTED_DATA_TO_COLLECTION';

export type AddToCollectionParams = {
  collectionId: number;
  protectedData: AddressOrENS;
  appWhitelist?: Address;
  onStatusUpdate?: OnStatusUpdateFn<AddToCollectionStatuses>;
};

export type RemoveFromCollectionParams = {
  protectedData: AddressOrENS;
};

export type GetCollectionsByOwnerParams = {
  owner: AddressOrENS;
  includeHiddenProtectedDatas?: boolean;
};

export type GetCollectionsByOwnerResponse = {
  collections: CollectionWithProtectedDatas[];
};

export type CollectionWithProtectedDatas = {
  id: number;
  owner: {
    id: AddressOrENS;
  };
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
  protectedData?: Address;
  collectionId?: number;
  collectionOwner?: AddressOrENS;
  createdAfterTimestamp?: number;
  isRentable?: boolean;
  isForSale?: boolean;
  isDistributed?: boolean;
  page?: number;
  pageSize?: number;
};

// ---------------------Subscription Types------------------------------------
export type SetProtectedDataToSubscriptionParams = {
  protectedData: AddressOrENS;
};

export type SetSubscriptionParams = {
  collectionId: number;
  priceInNRLC: number;
  durationInSeconds: number;
};

export type GetCollectionSubscriptionsResponse = {
  collectionSubscriptions: CollectionSubscription[];
};

export type GetCollectionSubscriptionsParams = {
  subscriberAddress?: AddressOrENS;
  collectionId?: number;
  includePastSubscriptions?: boolean;
};

export type RemoveProtectedDataFromSubscriptionParams = {
  protectedData: AddressOrENS;
};

export type SubscribeToCollectionParams = {
  collectionId: number;
  duration: number;
};

// ---------------------Rental Types------------------------------------
export type SetProtectedDataToRentingParams = {
  protectedData: AddressOrENS;
  priceInNRLC: number;
  durationInSeconds: number;
};

export type RemoveProtectedDataFromRentingParams = {
  protectedData: AddressOrENS;
};

export type RentProtectedDataParams = {
  protectedData: AddressOrENS;
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
  protectedData?: AddressOrENS;
  includePastRentals?: boolean;
};

export type GetRentalsResponse = {
  rentals: ProtectedDataRental[];
};

// ---------------------Sell Types------------------------------------
export type SetProtectedDataForSaleParams = {
  protectedData: AddressOrENS;
  priceInNRLC: number;
};

export type RemoveProtectedDataForSaleParams = {
  protectedData: AddressOrENS;
};

export type BuyProtectedDataParams = {
  protectedData: AddressOrENS;
  addToCollectionId?: number;
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
