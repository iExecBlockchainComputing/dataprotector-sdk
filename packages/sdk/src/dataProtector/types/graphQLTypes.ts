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
    creationTimestamp: string;
    collection: { id: bigint };
  }>;
};

// ---------------------Collection Types------------------------------------
export type GetCollectionsByOwnerGraphQLResponse = {
  collections: Array<OneCollectionByOwnerResponse>;
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

export type GetCollectionSubscribersGraphQLResponse = {
  collectionSubscriptions: CollectionSubscription[];
};

type CollectionSubscription = {
  subscriber: {
    id: string;
  };
  endDate: string;
};

export type GetCreatorsGraphQLResponse = {
  accounts: Array<{ id: Address }>;
};

export type GetProtectedDataByIdGraphQLResponse = {
  protectedData: { id: Address; name: string; owner: { id: Address } };
};

export type CollectionExistsGraphQLResponse = {
  collections: { id: string }[];
};

export type IsCollectionOwnerGraphQLResponse = {
  collection: {
    owner: {
      id: string;
    };
  };
};

export type IsProtectedDataInCollectionGraphQLResponse = {
  collection: {
    protectedDatas: { id: string }[];
  };
};

// ---------------------Rental Types------------------------------------
export type GetRentersGraphQLResponse = {
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
