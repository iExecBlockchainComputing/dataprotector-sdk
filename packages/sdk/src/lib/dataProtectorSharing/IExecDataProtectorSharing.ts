import { IExecDataProtectorModule } from '../IExecDataProtectorModule.js';
import {
  AddToCollectionParams,
  BuyProtectedDataParams,
  ConsumeProtectedDataParams,
  ConsumeProtectedDataResponse,
  CreateCollectionResponse,
  Creator,
  GetCollectionsByOwnerParams,
  GetCollectionsByOwnerResponse,
  GetProtectedDataInCollectionsParams,
  GetProtectedDataPricingParams,
  GetProtectedDataPricingResponse,
  GetRentersParams,
  GetRentersResponse,
  GetSubscribersResponse,
  ProtectedDataInCollection,
  RemoveCollectionParams,
  RemoveFromCollectionParams,
  RemoveProtectedDataForSaleParams,
  RemoveProtectedDataFromRentingParams,
  RemoveProtectedDataFromSubscriptionParams,
  RentProtectedDataParams,
  SetProtectedDataForSaleParams,
  SetProtectedDataToRentingParams,
  SetProtectedDataToSubscriptionParams,
  SetSubscriptionParams,
  SubscribeParams,
  SuccessWithTransactionHash,
} from '../types/index.js';
import { addToCollection } from './addToCollection.js';
import { buyProtectedData } from './buyProtectedData.js';
import { consumeProtectedData } from './consumeProtectedData.js';
import { createCollection } from './createCollection.js';
import { getProtectedDataInCollections } from './getProtectedDataInCollections.js';
import { getRenters } from './getRenters.js';
import { getSubscribers } from './getSubscribers.js';
import { removeCollection } from './removeCollection.js';
import { removeProtectedDataForSale } from './removeProtectedDataForSale.js';
import { removeProtectedDataFromCollection } from './removeProtectedDataFromCollection.js';
import { removeProtectedDataFromRenting } from './removeProtectedDataFromRenting.js';
import { removeProtectedDataFromSubscription } from './removeProtectedDataFromSubscription.js';
import { rentProtectedData } from './rentProtectedData.js';
import { setProtectedDataForSale } from './setProtectedDataForSale.js';
import { setProtectedDataToRenting } from './setProtectedDataToRenting.js';
import { setProtectedDataToSubscription } from './setProtectedDataToSubscription.js';
import { setSubscriptionParams } from './setSubscriptionParams.js';
import { getCollectionsByOwner } from './subgraph/getCollectionsByOwner.js';
import { getCreators } from './subgraph/getCreators.js';
import { getProtectedDataPricingParams } from './subgraph/getProtectedDataPricingParams.js';
import { subscribe } from './subscribe.js';
import { withdraw } from './withdraw.js';

class IExecDataProtectorSharing extends IExecDataProtectorModule {
  createCollection = (): Promise<CreateCollectionResponse> =>
    createCollection({
      iexec: this.iexec,
      sharingContractAddress: this.sharingContractAddress,
    });

  removeCollection = (
    args: RemoveCollectionParams
  ): Promise<SuccessWithTransactionHash> =>
    removeCollection({
      ...args,
      iexec: this.iexec,
      sharingContractAddress: this.sharingContractAddress,
    });

  addToCollection = (
    args: AddToCollectionParams
  ): Promise<SuccessWithTransactionHash> =>
    addToCollection({
      ...args,
      iexec: this.iexec,
      sharingContractAddress: this.sharingContractAddress,
    });

  removeProtectedDataFromCollection = (
    args: RemoveFromCollectionParams
  ): Promise<SuccessWithTransactionHash> =>
    removeProtectedDataFromCollection({
      ...args,
      iexec: this.iexec,
      sharingContractAddress: this.sharingContractAddress,
    });

  getProtectedDataPricingParams = (
    args: GetProtectedDataPricingParams
  ): Promise<GetProtectedDataPricingResponse> => {
    return getProtectedDataPricingParams({
      ...args,
      graphQLClient: this.graphQLClient,
    });
  };

  setSubscriptionParams = (
    args: SetSubscriptionParams
  ): Promise<SuccessWithTransactionHash> =>
    setSubscriptionParams({
      ...args,
      iexec: this.iexec,
      sharingContractAddress: this.sharingContractAddress,
    });

  setProtectedDataToSubscription = (
    args: SetProtectedDataToSubscriptionParams
  ): Promise<SuccessWithTransactionHash> =>
    setProtectedDataToSubscription({
      ...args,
      iexec: this.iexec,
      sharingContractAddress: this.sharingContractAddress,
    });

  removeProtectedDataFromSubscription = (
    args: RemoveProtectedDataFromSubscriptionParams
  ): Promise<SuccessWithTransactionHash> =>
    removeProtectedDataFromSubscription({
      ...args,
      graphQLClient: this.graphQLClient,
      iexec: this.iexec,
      sharingContractAddress: this.sharingContractAddress,
    });

  setProtectedDataToRenting = (
    args: SetProtectedDataToRentingParams
  ): Promise<SuccessWithTransactionHash> =>
    setProtectedDataToRenting({
      ...args,
      iexec: this.iexec,
      sharingContractAddress: this.sharingContractAddress,
    });

  removeProtectedDataFromRenting = (
    args: RemoveProtectedDataFromRentingParams
  ): Promise<SuccessWithTransactionHash> =>
    removeProtectedDataFromRenting({
      ...args,
      iexec: this.iexec,
      sharingContractAddress: this.sharingContractAddress,
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
      iexec: this.iexec,
      sharingContractAddress: this.sharingContractAddress,
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

  getRenters = (args: GetRentersParams): Promise<GetRentersResponse> =>
    getRenters({ ...args, graphQLClient: this.graphQLClient });

  getProtectedDataInCollections(
    args?: GetProtectedDataInCollectionsParams
  ): Promise<ProtectedDataInCollection[]> {
    return getProtectedDataInCollections({
      ...args,
      graphQLClient: this.graphQLClient,
    });
  }

  rentProtectedData = (
    args: RentProtectedDataParams
  ): Promise<SuccessWithTransactionHash> =>
    rentProtectedData({
      ...args,
      iexec: this.iexec,
      sharingContractAddress: this.sharingContractAddress,
    });

  setProtectedDataForSale = (
    args: SetProtectedDataForSaleParams
  ): Promise<SuccessWithTransactionHash> =>
    setProtectedDataForSale({
      ...args,
      iexec: this.iexec,
      sharingContractAddress: this.sharingContractAddress,
    });

  removeProtectedDataForSale = (
    args: RemoveProtectedDataForSaleParams
  ): Promise<SuccessWithTransactionHash> =>
    removeProtectedDataForSale({
      ...args,
      iexec: this.iexec,
      sharingContractAddress: this.sharingContractAddress,
    });

  consumeProtectedData = (
    args: ConsumeProtectedDataParams
  ): Promise<ConsumeProtectedDataResponse> =>
    consumeProtectedData({
      ...args,
      iexec: this.iexec,
      sharingContractAddress: this.sharingContractAddress,
    });

  buyProtectedData = (
    args: BuyProtectedDataParams
  ): Promise<SuccessWithTransactionHash> =>
    buyProtectedData({
      ...args,
      iexec: this.iexec,
      sharingContractAddress: this.sharingContractAddress,
    });

  withdraw = (): Promise<SuccessWithTransactionHash> =>
    withdraw({
      iexec: this.iexec,
      sharingContractAddress: this.sharingContractAddress,
    });
}

export { IExecDataProtectorSharing };