import { Address, AddressOrENS } from './commonTypes.js';
import { OneCollectionByOwnerResponse } from './graphQLTypes.js';

/***************************************************************************
 *                        Sharing Types                                    *
 ***************************************************************************/
export type SuccessWithTransactionHash = {
  success: boolean;
  txHash: string;
};

export type OnStatusUpdateFn = (params: {
  title: string;
  isDone: boolean;
  payload?: Record<string, string>;
}) => void;

// ---------------------Collection Types------------------------------------
export type Creator = {
  address: AddressOrENS;
};

export type CreateCollectionResponse = {
  collectionTokenId: number;
  txHash: string;
};

export type AddToCollectionParams = {
  collectionTokenId: number;
  protectedDataAddress: AddressOrENS;
  appAddress?: AddressOrENS;
  onStatusUpdate?: OnStatusUpdateFn;
};

export type GetCollectionsByOwnerParams = {
  ownerAddress: AddressOrENS;
};

export type GetCollectionsByOwnerResponse = Array<OneCollectionByOwnerResponse>;

// ---------------------Subscription Types------------------------------------
export type SetProtectedDataToSubscriptionParams = {
  collectionTokenId: number;
  protectedDataAddress: AddressOrENS;
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

export type SubscribeParams = {
  collectionTokenId: number;
};

export type SetSubscriptionOptionsParams = {
  collectionTokenId: number;
  priceInNRLC: bigint;
  durationInSeconds: number;
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
  collectionTokenId: number;
  protectedDataAddress: Address;
  priceInNRLC: bigint;
  durationInSeconds: number;
};

export type RemoveProtectedDataFromRentingParams = {
  collectionTokenId: number;
  protectedDataAddress: Address;
};

export type RentProtectedDataParams = {
  collectionTokenId: number;
  protectedDataAddress: Address;
};

// ---------------------Sell Types------------------------------------
export type SetProtectedDataForSaleParams = {
  protectedDataAddress: Address;
  priceInNRLC: number;
};

export type RemoveProtectedDataForSaleParams = {
  protectedDataAddress: Address;
};
