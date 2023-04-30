import { IExec } from 'iexec';
import { GraphQLClient } from 'graphql-request';
import {
  ProtectedData,
  FetchGrantedAccessParams,
  FetchProtectedDataParams,
  GrantAccessParams,
  GrantedAccess,
  ProtectDataParams,
  RevokeAllAccessParams,
  RevokedAccess,
  ProtectDataMessage,
  ProtectedDataWithSecretProps,
} from './types.js';
import { Observable } from '../utils/reactive.js';
import { fetchGrantedAccess } from './fetchGrantedAccess.js';
import { grantAccess } from './grantAccess.js';
import { protectData } from './protectData.js';
import { protectDataObservable } from './protectDataObservable.js';
import { revokeAllAccess } from './revokeAllAccess.js';
import { revokeOneAccess } from './revokeOneAccess.js';
import { fetchProtectedData } from './fetchProtectedData.js';
import { DATAPROTECTOR_SUBGRAPH_ENDPOINT } from '../config/config.js';

export class IExecDataProtector {
  protectData: (
    args: ProtectDataParams
  ) => Promise<ProtectedDataWithSecretProps>;
  protectDataObservable: (
    args: ProtectDataParams
  ) => Observable<ProtectDataMessage>;
  grantAccess: (args: GrantAccessParams) => Promise<string>;
  fetchGrantedAccess: (args: GrantAccessParams) => Promise<GrantedAccess[]>;
  revokeAllAccess: (args: RevokeAllAccessParams) => Observable<any>;
  revokeOneAccess: (args: GrantedAccess) => Promise<RevokedAccess>;
  fetchProtectedData: (
    args?: FetchProtectedDataParams
  ) => Promise<ProtectedData[]>;

  constructor(
    ethProvider: any,
    { ipfsNodeMultiaddr, providerOptions = {}, iexecOptions = {} }: any = {}
  ) {
    let iexec: IExec;
    let graphQLClient: GraphQLClient;
    try {
      iexec = new IExec(
        { ethProvider },
        { confirms: 3, providerOptions, ...iexecOptions }
      );
    } catch (e) {
      throw Error('Unsupported ethProvider');
    }

    try {
      graphQLClient = new GraphQLClient(DATAPROTECTOR_SUBGRAPH_ENDPOINT);
    } catch (e) {
      throw Error('Impossible to create GraphQLClient');
    }

    this.protectData = (args: ProtectDataParams) =>
      protectData({ ...args, iexec, ipfsNodeMultiaddr });

    this.protectDataObservable = (args: ProtectDataParams) =>
      protectDataObservable({
        ...args,
        iexec,
        ipfsNodeMultiaddr,
      });

    this.grantAccess = (args: GrantAccessParams) =>
      grantAccess({ ...args, iexec });

    this.fetchGrantedAccess = (args: FetchGrantedAccessParams) =>
      fetchGrantedAccess({ ...args, iexec });

    this.revokeAllAccess = (args: RevokeAllAccessParams) =>
      revokeAllAccess({ ...args, iexec });

    this.revokeOneAccess = (args: GrantedAccess) =>
      revokeOneAccess({ ...args, iexec });

    this.fetchProtectedData = (args?: FetchProtectedDataParams) =>
      fetchProtectedData({
        ...args,
        iexec,
        graphQLClient,
      });
  }
}
