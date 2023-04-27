import { GraphQLClient } from 'graphql-request';
import {
  ProtectedData,
  FetchGrantedAccessParams,
  FetchProtectedDataParams,
  GrantAccessParams,
  Order,
  ProtectDataParams,
  RevokeAccessParams,
} from './types.js';
import { Web3Provider } from '@ethersproject/providers';
import { IExec } from 'iexec';
import { Observable } from '../utils/reactive.js';
import { fetchGrantedAccess } from './fetchGrantedAccess.js';
import { grantAccess } from './grantAccess.js';
import { protectData } from './protectData.js';
import { protectDataObservable } from './protectDataObservable.js';
import { revokeAccess } from './revokeAccess.js';
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
  fetchGrantedAccess: (args: GrantAccessParams) => Promise<Order[]>;
  revokeAccess: (args: RevokeAccessParams) => Observable;
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

      graphQLClient = new GraphQLClient(DATAPROTECTOR_SUBGRAPH_ENDPOINT);
    } catch (e) {
      if (e instanceof TypeError && e.message.includes('ethProvider')) {
      throw Error('Unsupported ethProvider');
      } else {
        throw Error('Impossible to create GraphQLClient');
      }
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
