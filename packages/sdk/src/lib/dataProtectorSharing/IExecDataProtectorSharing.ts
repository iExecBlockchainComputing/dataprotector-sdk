import { isValidProvider } from '../../utils/validators.js';
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
  GetResultFromCompletedTaskParams,
  GetResultFromCompletedTaskResponse,
  GetUserAppWhitelistParams,
  GetUserAppWhitelistResponse,
  RemoveCollectionParams,
  RemoveFromCollectionParams,
  RemoveProtectedDataForSaleParams,
  RemoveProtectedDataFromRentingParams,
  RemoveProtectedDataFromSubscriptionParams,
  RentProtectedDataParams,
  SetProtectedDataForSaleParams,
  SetProtectedDataRentingParams,
  SetProtectedDataToRentingParams,
  SetProtectedDataToSubscriptionParams,
  SetSubscriptionParams,
  SubscribeToCollectionParams,
  SuccessWithTransactionHash,
} from '../types/index.js';
import { addAppToAddOnlyAppWhitelist } from './addAppToAddOnlyAppWhitelist.js';
import { addToCollection } from './addToCollection.js';
import { buyProtectedData } from './buyProtectedData.js';
import { consumeProtectedData } from './consumeProtectedData.js';
import { createAddOnlyAppWhitelist } from './createAddOnlyAppWhitelist.js';
import { createCollection } from './createCollection.js';
import { getCollectionOwners } from './getCollectionOwners.js';
import { getCollectionsByOwner } from './getCollectionsByOwner.js';
import { getCollectionSubscriptions } from './getCollectionSubscriptions.js';
import { getProtectedDataInCollections } from './getProtectedDataInCollections.js';
import { getProtectedDataPricingParams } from './getProtectedDataPricingParams.js';
import { getRentals } from './getRentals.js';
import { getResultFromCompletedTask } from './getResultFromCompletedTask.js';
import { getUserAddOnlyAppWhitelist } from './getUserAddOnlyAppWhitelist.js';
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

class IExecDataProtectorSharing extends IExecDataProtectorModule {
  /*******************************************************************
   *                        Read / write functions                   *
   ******************************************************************/

  // -------------------- Collection --------------------

  async createCollection(): Promise<CreateCollectionResponse> {
    await isValidProvider(this.iexec);
    return createCollection({
      iexec: this.iexec,
      sharingContractAddress: this.sharingContractAddress,
    });
  }

  async removeCollection(
    args: RemoveCollectionParams
  ): Promise<SuccessWithTransactionHash> {
    await isValidProvider(this.iexec);
    return removeCollection({
      ...args,
      iexec: this.iexec,
      sharingContractAddress: this.sharingContractAddress,
    });
  }

  async addToCollection(
    args: AddToCollectionParams
  ): Promise<SuccessWithTransactionHash> {
    await isValidProvider(this.iexec);
    return addToCollection({
      ...args,
      iexec: this.iexec,
      sharingContractAddress: this.sharingContractAddress,
    });
  }

  async removeProtectedDataFromCollection(
    args: RemoveFromCollectionParams
  ): Promise<SuccessWithTransactionHash> {
    await isValidProvider(this.iexec);
    return removeProtectedDataFromCollection({
      ...args,
      iexec: this.iexec,
      sharingContractAddress: this.sharingContractAddress,
    });
  }

  // -------------------- Renting --------------------

  async setProtectedDataToRenting(
    args: SetProtectedDataToRentingParams
  ): Promise<SuccessWithTransactionHash> {
    await isValidProvider(this.iexec);
    return setProtectedDataToRenting({
      ...args,
      iexec: this.iexec,
      sharingContractAddress: this.sharingContractAddress,
    });
  }

  // eslint-disable-next-line sonarjs/no-identical-functions
  async setProtectedDataRentingParams(
    args: SetProtectedDataRentingParams
  ): Promise<SuccessWithTransactionHash> {
    await isValidProvider(this.iexec);
    return setProtectedDataToRenting({
      ...args,
      iexec: this.iexec,
      sharingContractAddress: this.sharingContractAddress,
    });
  }

  async rentProtectedData(
    args: RentProtectedDataParams
  ): Promise<SuccessWithTransactionHash> {
    await isValidProvider(this.iexec);
    return rentProtectedData({
      ...args,
      iexec: this.iexec,
      sharingContractAddress: this.sharingContractAddress,
    });
  }

  async removeProtectedDataFromRenting(
    args: RemoveProtectedDataFromRentingParams
  ): Promise<SuccessWithTransactionHash> {
    await isValidProvider(this.iexec);
    return removeProtectedDataFromRenting({
      ...args,
      iexec: this.iexec,
      sharingContractAddress: this.sharingContractAddress,
    });
  }

  // -------------------- Selling --------------------

  async setProtectedDataForSale(
    args: SetProtectedDataForSaleParams
  ): Promise<SuccessWithTransactionHash> {
    await isValidProvider(this.iexec);
    return setProtectedDataForSale({
      ...args,
      iexec: this.iexec,
      sharingContractAddress: this.sharingContractAddress,
    });
  }

  async buyProtectedData(
    args: BuyProtectedDataParams
  ): Promise<SuccessWithTransactionHash> {
    await isValidProvider(this.iexec);
    return buyProtectedData({
      ...args,
      iexec: this.iexec,
      sharingContractAddress: this.sharingContractAddress,
    });
  }

  async removeProtectedDataForSale(
    args: RemoveProtectedDataForSaleParams
  ): Promise<SuccessWithTransactionHash> {
    await isValidProvider(this.iexec);
    return removeProtectedDataForSale({
      ...args,
      iexec: this.iexec,
      sharingContractAddress: this.sharingContractAddress,
    });
  }

  // -------------------- Subscription --------------------

  async setSubscriptionParams(
    args: SetSubscriptionParams
  ): Promise<SuccessWithTransactionHash> {
    await isValidProvider(this.iexec);
    return setSubscriptionParams({
      ...args,
      iexec: this.iexec,
      sharingContractAddress: this.sharingContractAddress,
    });
  }

  async setProtectedDataToSubscription(
    args: SetProtectedDataToSubscriptionParams
  ): Promise<SuccessWithTransactionHash> {
    await isValidProvider(this.iexec);
    return setProtectedDataToSubscription({
      ...args,
      iexec: this.iexec,
      sharingContractAddress: this.sharingContractAddress,
    });
  }

  async subscribeToCollection(
    args: SubscribeToCollectionParams
  ): Promise<SuccessWithTransactionHash> {
    await isValidProvider(this.iexec);
    return subscribeToCollection({
      ...args,
      iexec: this.iexec,
      sharingContractAddress: this.sharingContractAddress,
    });
  }

  async removeProtectedDataFromSubscription(
    args: RemoveProtectedDataFromSubscriptionParams
  ): Promise<SuccessWithTransactionHash> {
    await isValidProvider(this.iexec);
    return removeProtectedDataFromSubscription({
      ...args,
      graphQLClient: this.graphQLClient,
      iexec: this.iexec,
      sharingContractAddress: this.sharingContractAddress,
    });
  }

  // -------------------- Consume --------------------

  async consumeProtectedData(
    args: ConsumeProtectedDataParams
  ): Promise<ConsumeProtectedDataResponse> {
    await isValidProvider(this.iexec);
    return consumeProtectedData({
      ...args,
      iexec: this.iexec,
      sharingContractAddress: this.sharingContractAddress,
    });
  }

  async getResultFromCompletedTask(
    args: GetResultFromCompletedTaskParams
  ): Promise<GetResultFromCompletedTaskResponse> {
    await isValidProvider(this.iexec);
    return getResultFromCompletedTask({
      ...args,
      iexec: this.iexec,
    });
  }

  // -------------------- Apps whitelist --------------------

  async createAddOnlyAppWhitelist(): Promise<CreateAppWhitelistResponse> {
    await isValidProvider(this.iexec);
    return createAddOnlyAppWhitelist({
      iexec: this.iexec,
      sharingContractAddress: this.sharingContractAddress,
    });
  }

  async addAppToAddOnlyAppWhitelist(
    args: AddAppToAppWhitelistParams
  ): Promise<SuccessWithTransactionHash> {
    await isValidProvider(this.iexec);
    return addAppToAddOnlyAppWhitelist({
      ...args,
      iexec: this.iexec,
      sharingContractAddress: this.sharingContractAddress,
    });
  }

  /*******************************************************************
   *                        Read-only functions                      *
   ******************************************************************/

  getProtectedDataInCollections(
    args?: GetProtectedDataInCollectionsParams
  ): Promise<GetProtectedDataInCollectionsResponse> {
    return getProtectedDataInCollections({
      ...args,
      graphQLClient: this.graphQLClient,
    });
  }

  getProtectedDataPricingParams(
    args: GetProtectedDataPricingParams
  ): Promise<GetProtectedDataPricingParamsResponse> {
    return getProtectedDataPricingParams({
      ...args,
      graphQLClient: this.graphQLClient,
    });
  }

  getCollectionOwners(
    args?: GetCollectionOwnersParams
  ): Promise<GetCollectionOwnersResponse> {
    return getCollectionOwners({
      ...args,
      iexec: this.iexec,
      graphQLClient: this.graphQLClient,
    });
  }

  getCollectionsByOwner(
    args: GetCollectionsByOwnerParams
  ): Promise<GetCollectionsByOwnerResponse> {
    return getCollectionsByOwner({
      ...args,
      graphQLClient: this.graphQLClient,
    });
  }

  getCollectionSubscriptions(
    args?: GetCollectionSubscriptionsParams
  ): Promise<GetCollectionSubscriptionsResponse> {
    return getCollectionSubscriptions({
      ...args,
      graphQLClient: this.graphQLClient,
    });
  }

  getRentals(args?: GetRentalsParams): Promise<GetRentalsResponse> {
    return getRentals({
      ...args,
      graphQLClient: this.graphQLClient,
    });
  }

  getUserAddOnlyAppWhitelist(
    args?: GetUserAppWhitelistParams
  ): Promise<GetUserAppWhitelistResponse> {
    return getUserAddOnlyAppWhitelist({
      ...args,
      iexec: this.iexec,
      graphQLClient: this.graphQLClient,
    });
  }
}

export { IExecDataProtectorSharing };
