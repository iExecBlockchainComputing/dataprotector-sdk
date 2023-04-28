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
} from './types.js';
import { Web3Provider } from '@ethersproject/providers';
import { IExec } from 'iexec';
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
  protectData: (args: ProtectDataParams) => Promise<{
    dataAddress: string;
    dataSchema: string;
    zipFile: Uint8Array;
    encryptionKey: string;
    ipfsMultiaddr: string;
  }>;
  protectDataObservable: (args: ProtectDataParams) => Observable;
  grantAccess: (args: GrantAccessParams) => Promise<string>;
  fetchGrantedAccess: (args: GrantAccessParams) => Promise<GrantedAccess[]>;
  revokeAllAccess: (args: RevokeAllAccessParams) => Observable;
  revokeOneAccess: (args: GrantedAccess) => Promise<RevokedAccess>;
  fetchProtectedData: (
    args?: FetchProtectedDataParams
  ) => Promise<ProtectedData[]>;

  constructor(
    ethProvider: any,
    { ipfsNodeMultiaddr, providerOptions = {}, iexecOptions = {} }: any = {}
  ) {
    let iexec: any;
    let ethersProvider: any;
    let graphQLClient: GraphQLClient;
    try {
      iexec = new IExec(
        { ethProvider },
        { confirms: 3, providerOptions, ...iexecOptions }
      );
      ethersProvider = ethProvider.provider || new Web3Provider(ethProvider);
    } catch (e) {
      throw Error('Unsupported ethProvider');
    }

    try {
      graphQLClient = new GraphQLClient(DATAPROTECTOR_SUBGRAPH_ENDPOINT);
    } catch (e) {
      throw Error('Impossible to create GraphQLClient');
    }

    this.protectData = (args: ProtectDataParams) =>
      protectData({ ...args, iexec, ethersProvider, ipfsNodeMultiaddr });

    this.protectDataObservable = (args: ProtectDataParams) =>
      protectDataObservable({
        ...args,
        iexec,
        ethersProvider,
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
