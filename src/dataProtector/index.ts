import { Web3Provider } from '@ethersproject/providers';
import { IExec } from 'iexec';
import {
  ProtectDataOptions,
  GrantAccessOptions,
  RevokeAccessOptions,
  Order,
  Dataset,
} from './types';
import { Observable } from '../utils/reactive';
import { grantAccess } from './grantAccess';
import { protectData } from './protectData';
import { protectDataObservable } from './protectDataObservable';
import { revokeAccess } from './revokeAccess';
import { fetchGrantedAccess } from './fetchGrantedAccess';
import { fetchProtectedData } from './fetchProtectedData';
import { ApolloClient, InMemoryCache } from '@apollo/client';

export default class IExecDataProtector {
  protectData: (args: ProtectDataOptions) => Promise<any>;
  protectDataObservable: (args: ProtectDataOptions) => Observable;
  grantAccess: (args: GrantAccessOptions) => Promise<string>;
  revokeAccess: (args: RevokeAccessOptions) => Observable;
  fetchGrantedAccess: (args: GrantAccessOptions) => Promise<Order[]>;
  fetchProtectedData: (restrictedSchema?: string, restrictedOwner?: string) => Promise<Dataset[]>;

  constructor(
    ethProvider: any,
    { ipfsNodeMultiaddr, providerOptions = {}, iexecOptions = {} }: any = {}
  ) {
    let iexec: any;
    let ethersProvider: any;
    let client: any;
    try {
      client = new ApolloClient({
        uri: 'http://localhost:8000/subgraphs/name/DataProtector/graphql',
        cache: new InMemoryCache(),
      });
      iexec = new IExec(
        { ethProvider },
        { confirms: 3, providerOptions, ...iexecOptions }
      );
      ethersProvider = ethProvider.provider || new Web3Provider(ethProvider);
    } catch (e) {
      throw Error('Unsupported ethProvider');
    }

    this.protectData = (args: ProtectDataOptions) =>
      protectData({ ...args, iexec, ipfsNodeMultiaddr });

    this.protectDataObservable = (args: ProtectDataOptions) =>
      protectDataObservable({
        ...args,
        iexec,
        ethersProvider,
        ipfsNodeMultiaddr,
      });

    this.grantAccess = (args: GrantAccessOptions) =>
      grantAccess({ ...args, iexec });

    this.revokeAccess = (args: RevokeAccessOptions) =>
      revokeAccess({ ...args, iexec });

    this.fetchGrantedAccess = (args: GrantAccessOptions) =>
      fetchGrantedAccess({ ...args, iexec });

    this.fetchProtectedData = (restrictedSchema?: string, restrictedOwner?: string) =>
      fetchProtectedData({ restrictedSchema, restrictedOwner, iexec, client });
  }
}
