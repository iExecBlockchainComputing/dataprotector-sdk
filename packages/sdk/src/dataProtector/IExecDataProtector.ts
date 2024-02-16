import { Eip1193Provider } from 'ethers';
import { GraphQLClient } from 'graphql-request';
import { IExec } from 'iexec';
import {
  DEFAULT_CONTRACT_ADDRESS,
  DEFAULT_IEXEC_IPFS_NODE,
  DEFAULT_IPFS_GATEWAY,
  DEFAULT_SHARING_CONTRACT_ADDRESS,
  DEFAULT_SUBGRAPH_URL,
} from '../config/config.js';
import { Observable } from '../utils/reactive.js';
import { fetchGrantedAccess } from './fetchGrantedAccess.js';
import { fetchProtectedData } from './fetchProtectedData.js';
import { grantAccess } from './grantAccess.js';
import { processProtectedData } from './processProtectedData.js';
import { protectData } from './protectData.js';
import { protectDataObservable } from './protectDataObservable.js';
import { revokeAllAccessObservable } from './revokeAllAccessObservable.js';
import { revokeOneAccess } from './revokeOneAccess.js';
import { addToCollection } from './sharing/addToCollection.js';
import { createCollection } from './sharing/createCollection.js';
import { getSubscribers } from './sharing/getSubscribers.js';
import { removeCollection } from './sharing/removeCollection.js';
import { removeFromCollection } from './sharing/removeFromCollection.js';
import { removeProtectedDataForSale } from './sharing/removeProtectedDataForSale.js';
import { removeProtectedDataFromRenting } from './sharing/removeProtectedDataFromRenting.js';
import { rentProtectedData } from './sharing/rentProtectedData.js';
import { setProtectedDataForSale } from './sharing/setProtectedDataForSale.js';
import { setProtectedDataToRenting } from './sharing/setProtectedDataToRenting.js';
import { setProtectedDataToSubscription } from './sharing/setProtectedDataToSubscription.js';
import { setSubscriptionParams } from './sharing/setSubscriptionParams.js';
import { saveForSharingContract } from './sharing/smartContract/getSharingContract.js';
import { getCollectionsByOwner } from './sharing/subgraph/getCollectionsByOwner.js';
import { getCreators } from './sharing/subgraph/getCreators.js';
import { getRenters } from './sharing/subgraph/getRenters.js';
import { subscribe } from './sharing/subscribe.js';
import { saveForPocoRegistryContract } from './smartContract/getPocoRegistryContract.js';
import { transferOwnership } from './transferOwnership.js';
import {
  AddressOrENS,
  AddToCollectionParams,
  CreateCollectionResponse,
  Creator,
  DataProtectorConfigOptions,
  FetchGrantedAccessParams,
  FetchProtectedDataParams,
  GetCollectionsByOwnerParams,
  GetCollectionsByOwnerResponse,
  GetRentersParams,
  GetSubscribersResponse,
  GrantAccessParams,
  GrantedAccess,
  GrantedAccessResponse,
  ProcessProtectedDataParams,
  ProtectDataMessage,
  ProtectDataParams,
  ProtectedData,
  ProtectedDataWithSecretProps,
  RemoveCollectionParams,
  RemoveFromCollectionParams,
  RemoveProtectedDataForSaleParams,
  RemoveProtectedDataFromRentingParams,
  Renters,
  RentProtectedDataParams,
  RevokeAllAccessMessage,
  RevokeAllAccessParams,
  RevokedAccess,
  SetProtectedDataForSaleParams,
  SetProtectedDataToRentingParams,
  SetProtectedDataToSubscriptionParams,
  SetSubscriptionParams,
  SubscribeParams,
  SuccessWithTransactionHash,
  Taskid,
  TransferParams,
  TransferResponse,
  Web3SignerProvider,
} from './types/index.js';

class IExecDataProtector {
  private contractAddress: AddressOrENS;

  private sharingContractAddress: AddressOrENS;

  private graphQLClient: GraphQLClient;

  private ipfsNode: string;

  private ipfsGateway: string;

  private iexec: IExec;

  constructor(
    ethProvider: Eip1193Provider | Web3SignerProvider,
    options?: DataProtectorConfigOptions
  ) {
    try {
      this.iexec = new IExec({ ethProvider }, options?.iexecOptions);
    } catch (e) {
      throw new Error(`Unsupported ethProvider, ${e.message}`);
    }
    try {
      this.graphQLClient = new GraphQLClient(
        options?.subgraphUrl || DEFAULT_SUBGRAPH_URL
      );
    } catch (error) {
      throw new Error(`Failed to create GraphQLClient: ${error.message}`);
    }
    this.contractAddress = options?.contractAddress || DEFAULT_CONTRACT_ADDRESS;
    this.sharingContractAddress =
      options?.sharingContractAddress || DEFAULT_SHARING_CONTRACT_ADDRESS;
    this.ipfsNode = options?.ipfsNode || DEFAULT_IEXEC_IPFS_NODE;
    this.ipfsGateway = options?.ipfsGateway || DEFAULT_IPFS_GATEWAY;

    saveForSharingContract(this.iexec, this.sharingContractAddress);
    saveForPocoRegistryContract(this.iexec);
  }

  protectData(args: ProtectDataParams): Promise<ProtectedDataWithSecretProps> {
    return protectData({
      ...args,
      contractAddress: this.contractAddress,
      ipfsNode: this.ipfsNode,
      ipfsGateway: this.ipfsGateway,
      iexec: this.iexec,
    });
  }

  protectDataObservable(
    args: ProtectDataParams
  ): Observable<ProtectDataMessage> {
    return protectDataObservable({
      ...args,
      contractAddress: this.contractAddress,
      ipfsNode: this.ipfsNode,
      ipfsGateway: this.ipfsGateway,
      iexec: this.iexec,
    });
  }

  grantAccess(args: GrantAccessParams): Promise<GrantedAccess> {
    return grantAccess({ ...args, iexec: this.iexec });
  }

  fetchGrantedAccess(
    args: FetchGrantedAccessParams
  ): Promise<GrantedAccessResponse> {
    return fetchGrantedAccess({ ...args, iexec: this.iexec });
  }

  revokeAllAccessObservable(
    args: RevokeAllAccessParams
  ): Observable<RevokeAllAccessMessage> {
    return revokeAllAccessObservable({ ...args, iexec: this.iexec });
  }

  revokeOneAccess(args: GrantedAccess): Promise<RevokedAccess> {
    return revokeOneAccess({ ...args, iexec: this.iexec });
  }

  fetchProtectedData(
    args?: FetchProtectedDataParams
  ): Promise<ProtectedData[]> {
    return fetchProtectedData({
      ...args,
      iexec: this.iexec,
      graphQLClient: this.graphQLClient,
    });
  }

  transferOwnership(args: TransferParams): Promise<TransferResponse> {
    return transferOwnership({ ...args, iexec: this.iexec });
  }

  processProtectedData = (args: ProcessProtectedDataParams): Promise<Taskid> =>
    processProtectedData({
      ...args,
      iexec: this.iexec,
    });

  /***************************************************************************
   *                        Sharing Methods                                  *
   ***************************************************************************/

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

export { IExecDataProtector };
