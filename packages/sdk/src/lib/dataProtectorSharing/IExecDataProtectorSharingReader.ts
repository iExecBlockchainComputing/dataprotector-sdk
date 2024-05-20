import { IExecDataProtectorModule } from '../IExecDataProtectorModule.js';
import {
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
} from '../types/index.js';
import { getCollectionOwners } from './getCollectionOwners.js';
import { getCollectionsByOwner } from './getCollectionsByOwner.js';
import { getCollectionSubscriptions } from './getCollectionSubscriptions.js';
import { getProtectedDataInCollections } from './getProtectedDataInCollections.js';
import { getProtectedDataPricingParams } from './getProtectedDataPricingParams.js';
import { getRentals } from './getRentals.js';
import { getResultFromCompletedTask } from './getResultFromCompletedTask.js';
import { getUserAddOnlyAppWhitelist } from './getUserAddOnlyAppWhitelist.js';

class IExecDataProtectorSharingReader extends IExecDataProtectorModule {
  getProtectedDataPricingParams = (
    args: GetProtectedDataPricingParams
  ): Promise<GetProtectedDataPricingParamsResponse> => {
    return getProtectedDataPricingParams({
      ...args,
      graphQLClient: this.graphQLClient,
    });
  };

  getCollectionsByOwner = (
    args: GetCollectionsByOwnerParams
  ): Promise<GetCollectionsByOwnerResponse> =>
    getCollectionsByOwner({
      ...args,
      graphQLClient: this.graphQLClient,
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

  getRentals = (args: GetRentalsParams): Promise<GetRentalsResponse> =>
    getRentals({
      ...args,
      graphQLClient: this.graphQLClient,
    });

  getResultFromCompletedTask = (
    args: GetResultFromCompletedTaskParams
  ): Promise<GetResultFromCompletedTaskResponse> =>
    getResultFromCompletedTask({
      ...args,
      iexec: this.iexec,
    });

  getUserAddOnlyAppWhitelist = (
    args?: GetUserAppWhitelistParams
  ): Promise<GetUserAppWhitelistResponse> =>
    getUserAddOnlyAppWhitelist({
      ...args,
      iexec: this.iexec,
      graphQLClient: this.graphQLClient,
    });
}

export { IExecDataProtectorSharingReader };
