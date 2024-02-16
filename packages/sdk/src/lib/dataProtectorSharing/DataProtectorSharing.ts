import { IExecDataProtectorModule } from '../IExecDataProtectorModule.js';
import {
  AddToCollectionParams,
  CreateCollectionResponse,
  Creator,
  GetCollectionsByOwnerParams,
  GetCollectionsByOwnerResponse,
  GetRentersParams,
  GetSubscribersResponse,
  RemoveCollectionParams,
  RemoveFromCollectionParams,
  RemoveProtectedDataForSaleParams,
  RemoveProtectedDataFromRentingParams,
  Renters,
  RentProtectedDataParams,
  SetProtectedDataForSaleParams,
  SetProtectedDataToRentingParams,
  SetProtectedDataToSubscriptionParams,
  SetSubscriptionParams,
  SubscribeParams,
  SuccessWithTransactionHash,
} from '../types/index.js';
import { addToCollection } from './addToCollection.js';
import { createCollection } from './createCollection.js';
import { getSubscribers } from './getSubscribers.js';
import { removeCollection } from './removeCollection.js';
import { removeFromCollection } from './removeFromCollection.js';
import { removeProtectedDataForSale } from './removeProtectedDataForSale.js';
import { removeProtectedDataFromRenting } from './removeProtectedDataFromRenting.js';
import { rentProtectedData } from './rentProtectedData.js';
import { setProtectedDataForSale } from './setProtectedDataForSale.js';
import { setProtectedDataToRenting } from './setProtectedDataToRenting.js';
import { setProtectedDataToSubscription } from './setProtectedDataToSubscription.js';
import { setSubscriptionParams } from './setSubscriptionParams.js';
import { getCollectionsByOwner } from './subgraph/getCollectionsByOwner.js';
import { getCreators } from './subgraph/getCreators.js';
import { getRenters } from './subgraph/getRenters.js';
import { subscribe } from './subscribe.js';

class DataProtectorSharing extends IExecDataProtectorModule {
  createCollection = (): Promise<CreateCollectionResponse> =>
    createCollection();

  removeCollection = (
    args: RemoveCollectionParams
  ): Promise<SuccessWithTransactionHash> =>
    removeCollection({
      ...args,
      graphQLClient: this.graphQLClient,
      iexec: this.iexec,
    });

  addToCollection = (
    args: AddToCollectionParams
  ): Promise<SuccessWithTransactionHash> =>
    addToCollection({
      ...args,
      graphQLClient: this.graphQLClient,
      iexec: this.iexec,
      sharingContractAddress: this.sharingContractAddress,
    });

  removeFromCollection = (
    args: RemoveFromCollectionParams
  ): Promise<SuccessWithTransactionHash> =>
    removeFromCollection({
      ...args,
      graphQLClient: this.graphQLClient,
      iexec: this.iexec,
    });

  setSubscriptionParams = (
    args: SetSubscriptionParams
  ): Promise<SuccessWithTransactionHash> =>
    setSubscriptionParams({
      ...args,
      graphQLClient: this.graphQLClient,
      iexec: this.iexec,
    });

  setProtectedDataToSubscription = (
    args: SetProtectedDataToSubscriptionParams
  ): Promise<SuccessWithTransactionHash> =>
    setProtectedDataToSubscription({
      ...args,
      graphQLClient: this.graphQLClient,
      iexec: this.iexec,
    });

  setProtectedDataToRenting = (
    args: SetProtectedDataToRentingParams
  ): Promise<SuccessWithTransactionHash> =>
    setProtectedDataToRenting({
      ...args,
      graphQLClient: this.graphQLClient,
      iexec: this.iexec,
    });

  removeProtectedDataFromRenting = (
    args: RemoveProtectedDataFromRentingParams
  ): Promise<SuccessWithTransactionHash> =>
    removeProtectedDataFromRenting({
      ...args,
      graphQLClient: this.graphQLClient,
      iexec: this.iexec,
    });

  getCollectionsByOwner = (
    args: GetCollectionsByOwnerParams
  ): Promise<GetCollectionsByOwnerResponse> =>
    getCollectionsByOwner({
      ...args,
      graphQLClient: this.graphQLClient,
    });

  subscribe = (args: SubscribeParams): Promise<SuccessWithTransactionHash> =>
    subscribe({
      ...args,
      graphQLClient: this.graphQLClient,
    });

  getSubscribers = (args: SubscribeParams): Promise<GetSubscribersResponse> =>
    getSubscribers({
      ...args,
      graphQLClient: this.graphQLClient,
    });

  getCreators = (): Promise<Creator[]> =>
    getCreators({
      graphQLClient: this.graphQLClient,
    });

  getRenters = (args: GetRentersParams): Promise<Renters[]> =>
    getRenters({ ...args, graphQLClient: this.graphQLClient });

  rentProtectedData = (
    args: RentProtectedDataParams
  ): Promise<SuccessWithTransactionHash> =>
    rentProtectedData({
      ...args,
      graphQLClient: this.graphQLClient,
      iexec: this.iexec,
    });

  setProtectedDataForSale = (
    args: SetProtectedDataForSaleParams
  ): Promise<SuccessWithTransactionHash> => {
    return setProtectedDataForSale({
      ...args,
      graphQLClient: this.graphQLClient,
      iexec: this.iexec,
    });
  };

  removeProtectedDataForSale = (args: RemoveProtectedDataForSaleParams) => {
    return removeProtectedDataForSale({
      ...args,
      graphQLClient: this.graphQLClient,
      iexec: this.iexec,
    });
  };
}

export { DataProtectorSharing };
