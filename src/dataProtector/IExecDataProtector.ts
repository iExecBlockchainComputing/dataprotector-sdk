import { IExecConfigOptions } from 'iexec/IExecConfig';
import { providers } from 'ethers';
import { GraphQLClient } from 'graphql-request';
import { IExec } from 'iexec';
import { DATAPROTECTOR_DEFAULT_SUBGRAPH_URL } from '../config/config.js';
import { Observable } from '../utils/reactive.js';
import { fetchGrantedAccess } from './fetchGrantedAccess.js';
import { fetchProtectedData } from './fetchProtectedData.js';
import { grantAccess } from './grantAccess.js';
import { protectData } from './protectData.js';
import { protectDataObservable } from './protectDataObservable.js';
import { revokeAllAccessObservable } from './revokeAllAccessObservable.js';
import { revokeOneAccess } from './revokeOneAccess.js';
import {
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

export class IExecDataProtector {
  private graphQLClient: GraphQLClient;
  protectData: (
    args: ProtectDataParams
  ) => Promise<ProtectedDataWithSecretProps>;
  protectDataObservable: (
    args: ProtectDataParams
  ) => Observable<ProtectDataMessage>;
  grantAccess: (args: GrantAccessParams) => Promise<GrantedAccess>;
  fetchGrantedAccess: (
    args: FetchGrantedAccessParams
  ) => Promise<GrantedAccess[]>;
  revokeAllAccessObservable: (
    args: RevokeAllAccessParams
  ) => Observable<RevokeAllAccessMessage>;
  revokeOneAccess: (args: GrantedAccess) => Promise<RevokedAccess>;
  fetchProtectedData: (
    args?: FetchProtectedDataParams
  ) => Promise<ProtectedData[]>;
  transferOwnership: (args: TransferParams) => Promise<TransferResponse>;

  constructor(
    ethProvider: providers.ExternalProvider | Web3SignerProvider,
    options?: {
      subgraphUrl?: string;
      iexecOptions?: IExecConfigOptions;
    }
  ) {
    let iexec: IExec;
    try {
      iexec = new IExec({ ethProvider }, options?.iexecOptions);
    } catch (e) {
      throw Error('Unsupported ethProvider');
    }

    try {
      this.graphQLClient = new GraphQLClient(
        options?.subgraphUrl || DATAPROTECTOR_DEFAULT_SUBGRAPH_URL
      );
    } catch (error) {
      throw new Error(`Failed to create GraphQLClient: ${error.message}`);
    }

    this.protectData = (args: ProtectDataParams) =>
      protectData({ ...args, iexec });

    this.protectDataObservable = (args: ProtectDataParams) =>
      protectDataObservable({
        ...args,
        iexec,
      });

    this.grantAccess = (args: GrantAccessParams) =>
      grantAccess({ ...args, iexec });

    this.fetchGrantedAccess = (args: FetchGrantedAccessParams) =>
      fetchGrantedAccess({ ...args, iexec });

    this.revokeAllAccessObservable = (args: RevokeAllAccessParams) =>
      revokeAllAccessObservable({ ...args, iexec });

    this.revokeOneAccess = (args: GrantedAccess) =>
      revokeOneAccess({ ...args, iexec });

    this.fetchProtectedData = (args?: FetchProtectedDataParams) =>
      fetchProtectedData({
        ...args,
        graphQLClient: this.graphQLClient,
      });
    this.transferOwnership = (args: TransferParams) =>
      transferOwnership({ iexec, ...args });
  }
}
