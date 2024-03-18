import {
  Address,
  AddressOrENS,
  DataSchema,
  OnStatusUpdateFn,
} from './commonTypes.js';
import { OneCollectionByOwnerResponse } from './graphQLTypes.js';

/***************************************************************************
 *                        Sharing Types                                    *
 ***************************************************************************/
export type ProtectedDataDetails = {
  collection: Collection;
  appWhitelist: string;
  latestRentalExpiration: number;
  isInSubscription: boolean;
  userLatestRentalExpiration: number;
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

type Collection = {
  collectionTokenId: number;
  userLatestSubscriptionExpiration: number;
} & CollectionDetails;

export type CollectionDetails = {
  collectionOwner: Address;
  size: number;
  latestSubscriptionExpiration: number;
  subscriptionParams: { price: number; duration: number };
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

export type SharingContractConsumer = {
  sharingContractAddress: AddressOrENS;
};

export type SuccessWithTransactionHash = {
  txHash: string;
};

// ---------------------Collection Types------------------------------------
export type Creator = {
  address: AddressOrENS;
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

export type GetCollectionsByOwnerResponse = OneCollectionByOwnerResponse[];

export type GetProtectedDataInCollectionsParams = {
  requiredSchema?: DataSchema;
  collectionTokenId?: number;
  collectionOwner?: AddressOrENS;
  createdAfterTimestamp?: number;
  page?: number;
  pageSize?: number;
};

export type GetProtectedDataPricingParams = {
  protectedDataAddress: AddressOrENS;
};

export type GetProtectedDataPricingResponse = {
  address: Address;
  name: string;
  isFree: boolean;
  isRentable: boolean;
  isIncludedInSubscription: boolean;
  isForSale: boolean;
};

export type ConsumeProtectedDataParams = {
  protectedDataAddress: AddressOrENS;
  appAddress?: AddressOrENS;
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

// ---------------------Subscription Types------------------------------------
export type SetProtectedDataToSubscriptionParams = {
  protectedDataAddress: AddressOrENS;
};

export type SetSubscriptionParams = {
  collectionTokenId: number;
  priceInNRLC: number;
  durationInSeconds: number;
};

export type Subscriber = {
  address: Address;
  endSubscriptionTimestamp: number;
};

export type GetSubscribersResponse = {
  subscribers: Subscriber[];
};

export type SubscribeParams = {
  collectionTokenId: number;
  duration: number;
};

export type GetSubscribersParams = {
  collectionTokenId: number;
};

export type RemoveProtectedDataFromSubscriptionParams = {
  protectedDataAddress: Address;
};

// ---------------------Rental Types------------------------------------
export type GetRentersParams = {
  protectedDataAddress: AddressOrENS;
  includePastRentals?: boolean;
};

export type Renters = {
  id: string;
  renter: Address;
  endDateTimestamp: number;
  creationTimestamp: number;
  rentalParams: {
    durationInSeconds: number;
    priceInNRLC: number;
  };
};

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

export type GetRentersResponse = {
  renters: Renters[];
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
