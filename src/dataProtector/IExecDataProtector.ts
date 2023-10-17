import { IExecConfigOptions } from 'iexec/IExecConfig';
import { providers } from 'ethers';
import { GraphQLClient } from 'graphql-request';
import { IExec } from 'iexec';
import { DATAPROTECTOR_SUBGRAPH_ENDPOINT } from '../config/config.js';
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
  ProcessProtectedDataParams,
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
import { processProtectedData } from './processProtectedData.js';

export class IExecDataProtector {
  protectData: (
    args: ProtectDataParams
  ) => Promise<ProtectedDataWithSecretProps>;
  protectDataObservable: (
    args: ProtectDataParams
  ) => Observable<ProtectDataMessage>;
  processProtectedData: (args: ProcessProtectedDataParams) => Promise<string>;
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
      iexecOptions?: IExecConfigOptions;
    }
  ) {
    let iexec: IExec;
    let graphQLClient: GraphQLClient;
    try {
      iexec = new IExec({ ethProvider }, options?.iexecOptions);
    } catch (e) {
      throw Error('Unsupported ethProvider');
    }

    try {
      graphQLClient = new GraphQLClient(DATAPROTECTOR_SUBGRAPH_ENDPOINT);
    } catch (e) {
      throw Error('Impossible to create GraphQLClient');
    }

    this.protectData = (args: ProtectDataParams) =>
      protectData({ ...args, iexec });

    this.protectDataObservable = (args: ProtectDataParams) =>
      protectDataObservable({
        ...args,
        iexec,
      });
    this.processProtectedData = (args: ProcessProtectedDataParams) =>
      processProtectedData({
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
        graphQLClient,
      });
    this.transferOwnership = (args: TransferParams) =>
      transferOwnership({ iexec, ...args });
  }
}
