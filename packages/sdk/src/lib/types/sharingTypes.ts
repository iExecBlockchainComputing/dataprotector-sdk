import { Address, AddressOrENS, OnStatusUpdateFn } from './commonTypes.js';

/***************************************************************************
 *                        Sharing Types                                    *
 ***************************************************************************/

/**
 * @param duration - duration in seconds
 * @param price - price in nRLC
 */
export type SubscriptionParams = {
  duration: number;
  price: number;
};

/**
 * @param duration - duration in seconds
 * @param price - price in nRLC
 */
export type RentingParams = {
  duration: number;
  price: number;
};

/**
 * @param price - price in nRLC
 */
export type SellingParams = {
  price: number;
};

export type ProtectedDataDetails = {
  collection: Collection;
  addOnlyAppWhitelist: string;
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
  rentalParams?: RentingParams;
  rentals: Array<{
    renter: AddressOrENS;
    endDate: string;
  }>;
  isForSale: boolean;
  saleParams?: SellingParams;
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
      subscriptionParams?: SubscriptionParams;
    };
    rentalParam?: RentingParams;
  };
};

export type ConsumeProtectedDataStatuses =
  | 'FETCH_WORKERPOOL_ORDERBOOK'
  | 'PUSH_ENCRYPTION_KEY'
  | 'CONSUME_ORDER_REQUESTED'
  | 'CONSUME_TASK'
  | 'CONSUME_RESULT_DOWNLOAD'
  | 'CONSUME_RESULT_DECRYPT'
  | 'CONSUME_RESULT_COMPLETE';

export type ConsumeProtectedDataParams = {
  protectedData: AddressOrENS;
  app: AddressOrENS;
  workerpool?: AddressOrENS;
  pemPublicKey?: string;
  pemPrivateKey?: string;
  onStatusUpdate?: OnStatusUpdateFn<ConsumeProtectedDataStatuses>;
};

export type ConsumeProtectedDataResponse = {
  txHash: string;
  dealId: string;
  taskId: string;
  result: ArrayBuffer;
  pemPrivateKey: string;
};

export type GetResultFromCompletedTaskStatuses =
  | 'CONSUME_RESULT_DOWNLOAD'
  | 'CONSUME_RESULT_DECRYPT';

export type GetResultFromCompletedTaskParams = {
  taskId: string;
  path?: string;
  pemPrivateKey?: string;
  onStatusUpdate?: OnStatusUpdateFn<GetResultFromCompletedTaskStatuses>;
};

export type GetResultFromCompletedTaskResponse = {
  result: ArrayBuffer;
};

// ---------------------Collection Types------------------------------------

export type Collection = {
  collectionId: number;
  collectionOwner: Address;
  size: number;
  latestSubscriptionExpiration: number;
  subscriptionParams: SubscriptionParams;
};

export type CollectionOwner = {
  id: Address;
  hasActiveSubscription: boolean;
  collections: Array<{
    id: Address;
    creationTimestamp: number;
    subscriptionParams: SubscriptionParams;
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
  addOnlyAppWhitelist: Address;
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
  subscriptionParams?: SubscriptionParams;
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
  price: number;
  duration: number;
};

export type GetCollectionSubscriptionsParams = {
  subscriberAddress?: AddressOrENS;
  collectionId?: number;
  includePastSubscriptions?: boolean;
};

export type GetCollectionSubscriptionsResponse = {
  collectionSubscriptions: CollectionSubscription[];
};

export type CollectionSubscription = {
  id: string;
  collection: {
    id: string;
    owner: {
      id: AddressOrENS;
    };
    subscriptionParams: SubscriptionParams;
  };
  subscriber: {
    id: AddressOrENS;
  };
  creationTimestamp: number;
  endDate: number;
};

export type RemoveProtectedDataFromSubscriptionParams = {
  protectedData: AddressOrENS;
};

export type SubscribeToCollectionParams = {
  collectionId: number;
  price: number;
  duration: number;
};

// ---------------------Rental Types------------------------------------
export type SetProtectedDataToRentingParams = {
  protectedData: AddressOrENS;
  price: number;
  duration: number;
};

export type SetProtectedDataRentingParams = SetProtectedDataToRentingParams;

export type RemoveProtectedDataFromRentingParams = {
  protectedData: AddressOrENS;
};

export type RentProtectedDataParams = {
  protectedData: AddressOrENS;
  price: number;
  duration: number;
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
  rentalParams: RentingParams;
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
  price: number;
};

export type RemoveProtectedDataForSaleParams = {
  protectedData: AddressOrENS;
};

export type BuyProtectedDataParams = {
  protectedData: AddressOrENS;
  price: number;
  addToCollectionId?: number;
  addOnlyAppWhitelist?: Address;
};

// ---------------------AppWhitelist Types------------------------------------
export type AddAppToAppWhitelistParams = {
  addOnlyAppWhitelist: Address;
  app: AddressOrENS;
};

export type CreateAppWhitelistResponse = {
  addOnlyAppWhitelist: Address;
  txHash: string;
};

export type GetUserAppWhitelistParams = {
  user?: AddressOrENS;
};

export type GetUserAppWhitelistResponse = {
  addOnlyAppWhitelists: AddOnlyAppWhitelist[];
};

export type AddOnlyAppWhitelist = {
  address: string;
  owner: string;
  apps: Array<{
    address: string;
  }>;
};
