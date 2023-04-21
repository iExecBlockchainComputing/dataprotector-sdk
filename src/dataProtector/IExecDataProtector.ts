import { Web3Provider } from '@ethersproject/providers';
import { IExec } from 'iexec';
import { Observable } from '../utils/reactive';
import { fetchGrantedAccess } from './fetchGrantedAccess';
import { grantAccess } from './grantAccess';
import { protectData } from './protectData';
import { protectDataObservable } from './protectDataObservable';
import { revokeAccess } from './revokeAccess';
import {
  GrantAccessOptions,
  Order,
  ProtectDataOptions,
  RevokeAccessOptions,
} from './types';

export default class IExecDataProtector {
  protectData: (args: ProtectDataOptions) => Promise<any>;
  protectDataObservable: (args: ProtectDataOptions) => Observable;
  grantAccess: (args: GrantAccessOptions) => Promise<string>;
  fetchGrantedAccess: (args: GrantAccessOptions) => Promise<Order[]>;
  revokeAccess: (args: RevokeAccessOptions) => Observable;
  constructor(
    ethProvider: any,
    { ipfsNodeMultiaddr, providerOptions = {}, iexecOptions = {} }: any = {}
  ) {
    let iexec: any;
    let ethersProvider: any;
    try {
      iexec = new IExec(
        { ethProvider },
        { confirms: 3, providerOptions, ...iexecOptions }
      );
      ethersProvider = ethProvider.provider || new Web3Provider(ethProvider);
    } catch (e) {
      throw Error('Unsupported ethProvider');
    }

    this.protectData = (args: ProtectDataOptions) =>
      protectData({ ...args, iexec, ethersProvider, ipfsNodeMultiaddr });

    this.protectDataObservable = (args: ProtectDataOptions) =>
      protectDataObservable({
        ...args,
        iexec,
        ethersProvider,
        ipfsNodeMultiaddr,
      });

    this.grantAccess = (args: GrantAccessOptions) =>
      grantAccess({ ...args, iexec });

    this.fetchGrantedAccess = (args: GrantAccessOptions) =>
      fetchGrantedAccess({ ...args, iexec });

    this.revokeAccess = (args: RevokeAccessOptions) =>
      revokeAccess({ ...args, iexec });
  }
}
