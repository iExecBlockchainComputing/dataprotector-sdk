export * from './shared.js';

// TODO: Hard to think that we need to export types for each method... Find a better way?

export {
  FetchGrantedAccessParams,
  GrantedAccessResponse,
} from '../fetchGrantedAccess.js';
export { FetchProtectedDataParams } from '../fetchProtectedData.js';
export { GrantAccessParams } from '../grantAccess.js';
export { ProcessProtectedDataParams } from '../processProtectedData.js';
export { ProtectedDataWithSecretProps } from '../protectData.js';
export {
  RevokeAllAccessParams,
  RevokeAllAccessMessage,
} from '../revokeAllAccessObservable.js';
export { RevokedAccess } from '../revokeOneAccess.js';
export {
  TransferOwnershipParams,
  TransferOwnershipResponse,
} from '../transferOwnership.js';

/***************************************************************************
 *                        Sharing Types                                    *
 ***************************************************************************/
export {
  AddToCollectionParams,
  AddToCollectionResponse,
} from '../sharing/addToCollection.js';
export { CreateCollectionResponse } from '../sharing/createCollection.js';
export { GetSubscribersResponse } from '../sharing/getSubscribers.js';
export { SetProtectedDataToSubscriptionParams } from '../sharing/setProtectedDataToSubscription.js';
export { SetSubscriptionParams } from '../sharing/setSubscriptionParams.js';

// Subgraph queries
export {
  OneCollectionByOwnerResponse,
  GetCollectionsByOwnerResponse,
} from '../sharing/subgraph/getCollectionsByOwner.js';
export { Creator } from '../sharing/subgraph/getCreators.js';
export { Renters, GetRentersParams } from '../sharing/subgraph/getRenters.js';
