import { Address, AddressOrENS } from './commonTypes.js';
import {
  CollectionSubscription,
  ProtectedDataInCollection,
} from './sharingTypes.js';

/***************************************************************************
 *                        Subgraph Types                                    *
 ***************************************************************************/

// ---------------------ProtectedData Types------------------------------------

export type OneProtectedData = {
  id: Address;
  name: string;
  owner: { id: AddressOrENS };
  schema: Array<Record<'id', string>>;
  creationTimestamp: number;
};

export type ProtectedDatasGraphQLResponse = {
  protectedDatas: OneProtectedData[];
};

export type ProtectedDatasInCollectionsGraphQLResponse = {
  protectedDatas: ProtectedDataInCollection[];
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
export type GetCollectionSubscriptionsGraphQLResponse = {
  collectionSubscriptions: CollectionSubscription[];
};

export type GetCollectionOwnersGraphQLResponse = {
  accounts: Array<{
    id: Address;
    collections: Array<{
      subscriptions: Array<{
        subscriber: {
          id: Address;
        };
        endDate: number;
      }>;
      id: Address;
      creationTimestamp: number;
      subscriptionParams: {
        price: number;
        duration: number;
      };
    }>;
  }>;
};

// ---------------------Rental Types------------------------------------

export type GetRentalsGraphQLResponse = {
  rentals: Array<{
    id: string;
    renter: Address;
    protectedData: { id: AddressOrENS; name: string };
    creationTimestamp: number;
    endDate: number;
    rentalParams: {
      price: number;
      duration: number;
    };
  }>;
};

// ---------------------AppWhitelist Types------------------------------------

export type GetUserAddOnlyAppWhitelistGraphQLResponse = {
  addOnlyAppWhitelists: Array<{
    id: string;
    owner: {
      id: string;
    };
    apps: Array<{
      id: string;
    }>;
  }>;
};
