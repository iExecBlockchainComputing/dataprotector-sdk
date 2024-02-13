import { Transaction } from 'ethers';
import { Address, AddressOrENS } from './commonTypes.js';

/***************************************************************************
 *                        Sharing Types                                    *
 ***************************************************************************/
export type OnStatusUpdateFn = (params: {
  title: string;
  isDone: boolean;
  payload?: Record<string, string>;
}) => void;

export type Creator = {
  address: AddressOrENS;
};

// ---------------------Collection Types------------------------------------
export type CreateCollectionResponse = {
  collectionTokenId: number;
  transaction: Transaction;
};

export type AddToCollectionParams = {
  collectionTokenId: number;
  protectedDataAddress: AddressOrENS;
  appAddress?: AddressOrENS;
  onStatusUpdate?: OnStatusUpdateFn;
};

export type AddToCollectionResponse = {
  transaction: Transaction;
  success: boolean;
};

export type GetCollectionsByOwnerParams = {
  ownerAddress: AddressOrENS;
};
export type OneCollectionByOwnerResponse = {
  id: number;
  creationTimestamp: number;
  protectedDatas: Array<{
    id: Address;
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
      id: Address;
    };
    endDate: number;
  }>;
};

export type GetCollectionsByOwnerResponse = Array<OneCollectionByOwnerResponse>;

type CollectionSubscription = {
  subscriber: {
    id: string;
  };
  endDate: string;
};
export type GraphQLResponseSubscribers = {
  collectionSubscriptions: CollectionSubscription[];
};

// ---------------------Subscription Types------------------------------------
export type SetProtectedDataToSubscriptionParams = {
  collectionTokenId: number;
  protectedDataAddress: AddressOrENS;
};

export type SetProtectedDataToSubscriptionResponse = {
  transaction: Transaction;
  success: boolean;
};

export type SetSubscriptionParamsResponse = {
  transaction: Transaction;
  success: boolean;
};

export type SetSubscriptionParams = {
  collectionTokenId: number;
  priceInNRLC: bigint;
  durationInSeconds: number;
};

export type Subscriber = {
  address: Address;
  endSubscriptionTimestamp: number;
};

export type GetSubscribersResponse = {
  subscribers: Subscriber[];
};

export type SubscribeResponse = {
  transaction: Transaction;
  success: boolean;
};

export type SubscribeParams = {
  collectionTokenId: number;
};

export type SetSubscriptionOptionsParams = {
  collectionTokenId: number;
  priceInNRLC: bigint;
  durationInSeconds: number;
};

export type SetProtectedDataToRentingParams = {
  collectionTokenId: number;
  protectedDataAddress: Address;
  priceInNRLC: bigint;
  durationInSeconds: number;
};

export type RemoveProtectedDataFromRentingParams = {
  collectionTokenId: number;
  protectedDataAddress: Address;
};

export type SetSubscriptionOptionsResponse = {
  success: boolean;
};

export type SetProtectedDataToRentingResponse = {
  success: boolean;
  txHash: string;
};

export type RemoveProtectedDataFromRentingResponse = {
  success: boolean;
  txHash: string;
};

// ---------------------Rental Types------------------------------------
export type GetRentersParams = {
  protectedDataAddress: AddressOrENS;
  includePastRentals?: boolean;
};

// Define GraphQLRentersResponse type
export type GraphQLRentersResponse = {
  protectedData: {
    rentals: Array<{
      id: string;
      renter: Address;
      endDate: number;
      creationTimestamp: number;
      rentalParams: {
        duration: number;
        price: number;
      };
    }>;
  };
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
