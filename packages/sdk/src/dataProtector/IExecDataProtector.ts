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
import { removeProtectedDataFromRenting } from './sharing/removeProtectedDataAsRentable.js';
import { setProtectedDataToRenting } from './sharing/setProtectedDataAsRentable.js';
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
  AddToCollectionParams,
  AddToCollectionResponse,
  AddressOrENS,
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
  RemoveProtectedDataAsRentableParams,
  RemoveProtectedDataAsRentableResponse,
  Renters,
  RevokeAllAccessMessage,
  RevokeAllAccessParams,
  RevokedAccess,
  SetProtectedDataAsRentableParams,
  SetProtectedDataAsRentableResponse,
  SetProtectedDataToSubscriptionParams,
  SetProtectedDataToSubscriptionResponse,
  SetSubscriptionParams,
  SetSubscriptionParamsResponse,
  SubscribeParams,
  SubscribeResponse,
  Taskid,
  TransferParams,
  TransferResponse,
  Web3SignerProvider,
} from './types.js';

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

  getGraphQLClient(): GraphQLClient {
    return this.graphQLClient;
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
  ): Promise<SetSubscriptionParamsResponse> =>
    setSubscriptionParams({
      ...args,
    });

  setProtectedDataToSubscription = (
    args: SetProtectedDataToSubscriptionParams
  ): Promise<SetProtectedDataToSubscriptionResponse> =>
    setProtectedDataToSubscription({
      ...args,
    });

  setProtectedDataAsRentable = (
    args: SetProtectedDataAsRentableParams
  ): Promise<SetProtectedDataAsRentableResponse> =>
    setProtectedDataToRenting({
      ...args,
      graphQLClient: this.graphQLClient,
      iexec: this.iexec,
    });

  removeProtectedDataAsRentable = (
    args: RemoveProtectedDataAsRentableParams
  ): Promise<RemoveProtectedDataAsRentableResponse> =>
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

  subscribe = (args: SubscribeParams): Promise<SubscribeResponse> =>
    subscribe({
      ...args,
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
}

export { IExecDataProtector };
