import { IExecConfigOptions } from 'iexec/IExecConfig';
import { providers } from 'ethers';
import { GraphQLClient } from 'graphql-request';
import { IExec } from 'iexec';
import {
  DATAPROTECTOR_DEFAULT_SUBGRAPH_URL,
  DEFAULT_CONTRACT_ADDRESS,
  DEFAULT_IEXEC_IPFS_NODE,
  DEFAULT_IPFS_GATEWAY,
} from '../config/config.js';
import { Observable } from '../utils/reactive.js';
import { fetchGrantedAccess } from './fetchGrantedAccess.js';
import { fetchProtectedData } from './fetchProtectedData.js';
import { grantAccess } from './grantAccess.js';
import { protectData } from './protectData.js';
import { protectDataObservable } from './protectDataObservable.js';
import { revokeAllAccessObservable } from './revokeAllAccessObservable.js';
import { revokeOneAccess } from './revokeOneAccess.js';
import {
  AddressOrENS,
  FetchGrantedAccessParams,
  FetchProtectedDataParams,
  GrantAccessParams,
  GrantedAccess,
  ProtectDataMessage,
  ProtectDataParams,
  ProtectedData,
  ProtectedDataWithSecretProps,
  RevokeAllAccessMessage,
  RevokeAllAccessParams,
  RevokedAccess,
  TransferParams,
  TransferResponse,
  Web3SignerProvider,
} from './types.js';
import { transferOwnership } from './transferOwnership.js';

class IExecDataProtector {
  private contractAddress: AddressOrENS;
  private graphQLClient: GraphQLClient;
  private ipfsNode: string;
  private ipfsGateway: string;
  private iexec: IExec;

  constructor(
    ethProvider: providers.ExternalProvider | Web3SignerProvider,
    options?: {
      contractAddress?: AddressOrENS;
      subgraphUrl?: string;
      iexecOptions?: IExecConfigOptions;
      ipfsNode?: string;
      ipfsGateway?: string;
    }
  ) {
    try {
      this.iexec = new IExec({ ethProvider }, options?.iexecOptions);
    } catch (e) {
      throw new Error(`Unsupported ethProvider, ${e.message}`);
    }
    try {
      this.graphQLClient = new GraphQLClient(
        options?.subgraphUrl || DATAPROTECTOR_DEFAULT_SUBGRAPH_URL
      );
    } catch (error) {
      throw new Error(`Failed to create GraphQLClient: ${error.message}`);
    }
    this.contractAddress = options?.contractAddress || DEFAULT_CONTRACT_ADDRESS;
    this.ipfsNode = options?.ipfsNode || DEFAULT_IEXEC_IPFS_NODE;
    this.ipfsGateway = options?.ipfsGateway || DEFAULT_IPFS_GATEWAY;
  }

  getContractAddress(): AddressOrENS {
    return this.contractAddress;
  }
  getIPFSNode(): string {
    return this.ipfsNode;
  }
  getIPFSGateway(): string {
    return this.ipfsGateway;
  }
  getGraphQLClientURL(): string {
    return this.graphQLClient['url'];
  }
  getIExec(): IExec {
    return this.iexec;
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

  fetchGrantedAccess(args: FetchGrantedAccessParams): Promise<GrantedAccess[]> {
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
      graphQLClient: this.graphQLClient,
    });
  }

  transferOwnership(args: TransferParams): Promise<TransferResponse> {
    return transferOwnership({ iexec: this.iexec, ...args });
  }
}

export { IExecDataProtector };
