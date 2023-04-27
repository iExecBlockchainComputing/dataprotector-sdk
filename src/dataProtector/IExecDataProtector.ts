import { IExec } from 'iexec';
import { GraphQLClient } from 'graphql-request';
import {
  DataSchema,
  ProtectedData,
  FetchGrantedAccessParams,
  FetchProtectedDataParams,
  GrantAccessParams,
  Order,
  ProtectDataParams,
  RevokeAccessParams,
} from './types.js';
import { Observable } from '../utils/reactive.js';
import { fetchGrantedAccess } from './fetchGrantedAccess.js';
import { grantAccess } from './grantAccess.js';
import { protectData } from './protectData.js';
import {
  ProtectDataMessage,
  protectDataObservable,
} from './protectDataObservable.js';
import { revokeAccess } from './revokeAccess.js';
import { fetchProtectedData } from './fetchProtectedData.js';
import { DATAPROTECTOR_SUBGRAPH_ENDPOINT } from '../config/config.js';

export class IExecDataProtector {
  protectData: (args: ProtectDataParams) => Promise<{
    dataAddress: string;
    dataSchema: DataSchema;
    zipFile: Uint8Array;
    encryptionKey: string;
    multiaddr: string;
  }>;
  protectDataObservable: (
    args: ProtectDataParams
  ) => Observable<ProtectDataMessage>;
  grantAccess: (args: GrantAccessParams) => Promise<string>;
  fetchGrantedAccess: (args: GrantAccessParams) => Promise<Order[]>;
  revokeAccess: (args: RevokeAccessParams) => Observable<any>; // todo: create revoke access messages types
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

    // todo: `revokeAccess` is an ambiguous method naming (ticket PRO-97)
    this.revokeAccess = (args: RevokeAccessParams) =>
      revokeAccess({ ...args, iexec });

    this.fetchProtectedData = (args?: FetchProtectedDataParams) =>
      fetchProtectedData({
        ...args,
        iexec,
        graphQLClient,
      });
  }
}
