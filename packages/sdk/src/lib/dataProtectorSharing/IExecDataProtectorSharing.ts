import { IExecDataProtectorModule } from '../IExecDataProtectorModule.js';
import {
  AddAppToAppWhitelistParams,
  AddToCollectionParams,
  BuyProtectedDataParams,
  ConsumeProtectedDataParams,
  ConsumeProtectedDataResponse,
  CreateAppWhitelistResponse,
  CreateCollectionResponse,
  GetCollectionOwnersParams,
  GetCollectionOwnersResponse,
  GetCollectionsByOwnerParams,
  GetCollectionsByOwnerResponse,
  GetCollectionSubscriptionsParams,
  GetCollectionSubscriptionsResponse,
  GetProtectedDataInCollectionsParams,
  GetProtectedDataInCollectionsResponse,
  GetProtectedDataPricingParams,
  GetProtectedDataPricingParamsResponse,
  GetRentalsParams,
  GetRentalsResponse,
  GetUserAppWhitelistParams,
  GetUserAppWhitelistResponse,
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
  SubscribeToCollectionParams,
  SuccessWithTransactionHash,
} from '../types/index.js';
import { addAppToAppWhitelist } from './addAppToAppWhitelist.js';
import { addToCollection } from './addToCollection.js';
import { buyProtectedData } from './buyProtectedData.js';
import { consumeProtectedData } from './consumeProtectedData.js';
import { createAppWhitelist } from './createAppWhitelist.js';
import { createCollection } from './createCollection.js';
import { getCollectionOwners } from './getCollectionOwners.js';
import { getCollectionsByOwner } from './getCollectionsByOwner.js';
import { getCollectionSubscriptions } from './getCollectionSubscriptions.js';
import { getProtectedDataInCollections } from './getProtectedDataInCollections.js';
import { getProtectedDataPricingParams } from './getProtectedDataPricingParams.js';
import { getRentals } from './getRentals.js';
import { getUserAppWhitelist } from './getUserAppWhitelist.js';
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
import { subscribeToCollection } from './subscribeToCollection.js';
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
  ): Promise<GetProtectedDataPricingParamsResponse> => {
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

  subscribeToCollection = (
    args: SubscribeToCollectionParams
  ): Promise<SuccessWithTransactionHash> =>
    subscribeToCollection({
      ...args,
      iexec: this.iexec,
      sharingContractAddress: this.sharingContractAddress,
    });

  getCollectionSubscriptions = (
    args: GetCollectionSubscriptionsParams
  ): Promise<GetCollectionSubscriptionsResponse> =>
    getCollectionSubscriptions({
      ...args,
      graphQLClient: this.graphQLClient,
    });

  getCollectionOwners = (
    args: GetCollectionOwnersParams
  ): Promise<GetCollectionOwnersResponse> =>
    getCollectionOwners({
      ...args,
      iexec: this.iexec,
      graphQLClient: this.graphQLClient,
    });

  getProtectedDataInCollections = (
    args?: GetProtectedDataInCollectionsParams
  ): Promise<GetProtectedDataInCollectionsResponse> => {
    return getProtectedDataInCollections({
      ...args,
      graphQLClient: this.graphQLClient,
    });
  };

  rentProtectedData = (
    args: RentProtectedDataParams
  ): Promise<SuccessWithTransactionHash> =>
    rentProtectedData({
      ...args,
      iexec: this.iexec,
      sharingContractAddress: this.sharingContractAddress,
    });

  getRentals = (args: GetRentalsParams): Promise<GetRentalsResponse> =>
    getRentals({
      ...args,
      graphQLClient: this.graphQLClient,
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

  getUserAppWhitelist = (
    args?: GetUserAppWhitelistParams
  ): Promise<GetUserAppWhitelistResponse> =>
    getUserAppWhitelist({
      ...args,
      iexec: this.iexec,
      graphQLClient: this.graphQLClient,
    });

  createAppWhitelist = (): Promise<CreateAppWhitelistResponse> =>
    createAppWhitelist({
      iexec: this.iexec,
      sharingContractAddress: this.sharingContractAddress,
    });

  addAppToAppWhitelist = (
    args: AddAppToAppWhitelistParams
  ): Promise<SuccessWithTransactionHash> =>
    addAppToAppWhitelist({
      ...args,
      iexec: this.iexec,
      sharingContractAddress: this.sharingContractAddress,
    });
}

export { IExecDataProtectorSharing };
