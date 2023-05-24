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
  ProtectedData,
  ProtectedDataWithSecretProps,
  RevokeAllAccessMessage,
  RevokeAllAccessParams,
  RevokedAccess,
} from './types.js';

export class IExecDataProtector {
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

  constructor(ethProvider: any, { iexecOptions = {} }: any = {}) {
    let iexec: IExec;
    let graphQLClient: GraphQLClient;
    try {
      iexec = new IExec({ ethProvider }, iexecOptions);
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
  }
}
