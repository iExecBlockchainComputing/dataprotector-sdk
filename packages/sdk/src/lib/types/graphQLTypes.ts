import { Address, AddressOrENS } from './commonTypes.js';

/***************************************************************************
 *                        Subgraph Types                                    *
 ***************************************************************************/

// ---------------------DataProtector Types------------------------------------
export type ProtectedDatasGraphQLResponse = {
  protectedDatas: Array<{
    id: Address;
    name: string;
    owner: { id: AddressOrENS };
    schema: Array<Record<'id', string>>;
    collection: { id: bigint };
    isIncludedInSubscription: boolean;
    isRentable: boolean;
    isForSale: boolean;
    creationTimestamp: string;
  }>;
};

export type ProtectedDataPricingParamsGraphQLResponse = {
  protectedData?: {
    id: Address;
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

// ---------------------Collection Types------------------------------------
export type GetCollectionsByOwnerGraphQLResponse = {
  collections: OneCollectionByOwnerGraphQLResponse[];
};

export type OneProtectedData = {
  id: Address;
  name: string;
  creationTimestamp: number;
  isRentable: boolean;
  rentingParams?: {
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

export type OneCollectionByOwnerGraphQLResponse = {
  id: number;
  creationTimestamp: number;
  protectedDatas: OneProtectedData[];
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

export type GetCollectionSubscribersGraphQLResponse = {
  collectionSubscriptions: CollectionSubscription[];
};

type CollectionSubscription = {
  subscriber: {
    id: string;
  };
  endDate: string;
};

export type GetCollectionOwnersGraphQLResponse = {
  accounts: Array<{ id: Address }>;
};

// ---------------------Rental Types------------------------------------
export type GetRentalsGraphQLResponse = {
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
