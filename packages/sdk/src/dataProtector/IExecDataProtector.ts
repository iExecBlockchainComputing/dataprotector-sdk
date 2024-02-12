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
import {
  fetchGrantedAccess,
  FetchGrantedAccessParams,
  GrantedAccessResponse,
} from './fetchGrantedAccess.js';
import {
  fetchProtectedData,
  FetchProtectedDataParams,
} from './fetchProtectedData.js';
import { grantAccess, GrantAccessParams } from './grantAccess.js';
import {
  processProtectedData,
  ProcessProtectedDataParams,
} from './processProtectedData.js';
import { protectData, ProtectedDataWithSecretProps } from './protectData.js';
import { protectDataObservable } from './protectDataObservable.js';
import {
  RevokeAllAccessMessage,
  revokeAllAccessObservable,
  RevokeAllAccessParams,
} from './revokeAllAccessObservable.js';
import { RevokedAccess, revokeOneAccess } from './revokeOneAccess.js';
import {
  addToCollection,
  type AddToCollectionParams,
  type AddToCollectionResponse,
} from './sharing/addToCollection.js';
import {
  createCollection,
  type CreateCollectionResponse,
} from './sharing/createCollection.js';
import {
  getSubscribers,
  GetSubscribersResponse,
} from './sharing/getSubscribers.js';
import {
  setProtectedDataToSubscription,
  SetProtectedDataToSubscriptionParams,
} from './sharing/setProtectedDataToSubscription.js';
import {
  SetSubscriptionParams,
  setSubscriptionParams,
} from './sharing/setSubscriptionParams.js';
import { saveForSharingContract } from './sharing/smartContract/getSharingContract.js';
import {
  getCollectionsByOwner,
  GetCollectionsByOwnerResponse,
} from './sharing/subgraph/getCollectionsByOwner.js';
import { Creator, getCreators } from './sharing/subgraph/getCreators.js';
import {
  getRenters,
  GetRentersParams,
  Renters,
} from './sharing/subgraph/getRenters.js';
import { subscribe } from './sharing/subscribe.js';
import { saveForPocoRegistryContract } from './smartContract/getPocoRegistryContract.js';
import {
  transferOwnership,
  TransferOwnershipParams,
  TransferOwnershipResponse,
} from './transferOwnership.js';
import {
  AddressOrENS,
  CollectionTokenIdParam,
  DataProtectorConfigOptions,
  GetCollectionsByOwnerParams,
  GrantedAccess,
  ProtectDataMessage,
  ProtectDataParams,
  ProtectedData,
  SuccessWithTransactionHash,
  Taskid,
  Web3SignerProvider,
} from './types/shared.js';

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

  transferOwnership(
    args: TransferOwnershipParams
  ): Promise<TransferOwnershipResponse> {
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

  addToCollection = (
    args: AddToCollectionParams
  ): Promise<AddToCollectionResponse> =>
    addToCollection({
      ...args,
      graphQLClient: this.graphQLClient,
      iexec: this.iexec,
      sharingContractAddress: this.sharingContractAddress,
    });

  setSubscriptionParams = (
    args: SetSubscriptionParams
  ): Promise<SuccessWithTransactionHash> =>
    setSubscriptionParams({
      ...args,
    });

  setProtectedDataToSubscription = (
    args: SetProtectedDataToSubscriptionParams
  ): Promise<SuccessWithTransactionHash> =>
    setProtectedDataToSubscription({
      ...args,
    });

  getCollectionsByOwner = (
    args: GetCollectionsByOwnerParams
  ): Promise<GetCollectionsByOwnerResponse> =>
    getCollectionsByOwner({
      ...args,
      graphQLClient: this.graphQLClient,
    });

  subscribe = (
    args: CollectionTokenIdParam
  ): Promise<SuccessWithTransactionHash> =>
    subscribe({
      ...args,
    });

  getSubscribers = (
    args: CollectionTokenIdParam
  ): Promise<GetSubscribersResponse> =>
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
}

export { IExecDataProtector };
