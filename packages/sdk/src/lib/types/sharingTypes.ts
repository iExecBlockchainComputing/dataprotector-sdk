import {
  Address,
  AddressOrENS,
  DataSchema,
  OnStatusUpdateFn,
} from './commonTypes.js';

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
  name: string;
  address: Address;
  schema: DataSchema;
  collectionTokenId: number;
  isIncludedInSubscription: boolean;
  isRentable: boolean;
  isForSale: boolean;
  creationTimestamp: number;
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

export type ConsumeProtectedDataParams = {
  protectedDataAddress: AddressOrENS;
  onStatusUpdate?: OnStatusUpdateFn<
    'CONSUME_PROTECTED_DATA' | 'UPLOAD_RESULT_TO_IPFS'
  >;
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

export type CollectionOwners = {
  address: Address;
};

export type GetCollectionOwnersResponse = {
  collectionOwners: CollectionOwners[];
};

export type RemoveCollectionParams = {
  collectionTokenId: number;
};

export type CreateCollectionResponse = {
  collectionTokenId: number;
  txHash: string;
};

export type AddToCollectionParams = {
  collectionTokenId: number;
  protectedDataAddress: AddressOrENS;
  appWhitelist?: Address;
  onStatusUpdate?: OnStatusUpdateFn<
    'APPROVE_COLLECTION_CONTRACT' | 'ADD_PROTECTED_DATA_TO_COLLECTION'
  >;
};

export type RemoveFromCollectionParams = {
  protectedDataAddress: AddressOrENS;
};

export type GetCollectionsByOwnerParams = {
  ownerAddress: AddressOrENS;
};

export type GetCollectionsByOwnerResponse = {
  collections: CollectionWithProtectedDatas[];
};

export type CollectionWithProtectedDatas = {
  id: number;
  creationTimestamp: number;
  protectedDatas: Array<{
    address: Address;
    name: string;
    creationTimestamp: number;
    isRentable: boolean;
    isIncludedInSubscription: boolean;
  }>;
  subscriptionParams: {
    price: number;
    duration: number;
  };
  subscriptions: Array<{
    subscriber: {
      address: Address;
    };
    endDate: number;
  }>;
};

export type GetProtectedDataInCollectionsParams = {
  requiredSchema?: DataSchema;
  collectionTokenId?: number;
  collectionOwner?: AddressOrENS;
  createdAfterTimestamp?: number;
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

export type CollectionSubscription = {
  userAddress: Address;
  endSubscriptionTimestamp: number;
};

export type GetCollectionSubscriptionsResponse = {
  collectionSubscriptions: CollectionSubscription[];
};

export type GetCollectionSubscriptionsParams = {
  collectionTokenId: number;
  duration: number;
};

export type GetSubscribersParams = {
  collectionTokenId: number;
};

export type RemoveProtectedDataFromSubscriptionParams = {
  protectedDataAddress: Address;
};

export type SubscribeToCollectionParams = {
  collectionTokenId: number;
  duration: number;
};

// ---------------------Rental Types------------------------------------
export type SetProtectedDataToRentingParams = {
  protectedDataAddress: Address;
  priceInNRLC: number;
  durationInSeconds: number;
};

export type RemoveProtectedDataFromRentingParams = {
  protectedDataAddress: Address;
};

export type RentProtectedDataParams = {
  protectedDataAddress: Address;
};

export type GetProtectedDataRentalsParams = {
  protectedDataAddress: AddressOrENS;
  includePastRentals?: boolean;
};

export type ProtectedDataRental = {
  id: string;
  renter: Address;
  endDateTimestamp: number;
  creationTimestamp: number;
  rentalParams: {
    durationInSeconds: number;
    priceInNRLC: number;
  };
};

export type GetProtectedDataRentalsResponse = {
  rentals: ProtectedDataRental[];
};

// ---------------------Sell Types------------------------------------
export type SetProtectedDataForSaleParams = {
  protectedDataAddress: Address;
  priceInNRLC: number;
};

export type RemoveProtectedDataForSaleParams = {
  protectedDataAddress: Address;
};

export type BuyProtectedDataParams = {
  protectedDataAddress: Address;
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
