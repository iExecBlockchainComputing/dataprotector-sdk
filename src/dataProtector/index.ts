import { Web3Provider } from '@ethersproject/providers';
import { IExec } from 'iexec';
import { IGrantOptions, IRevokeOptions } from './types';
import { Observable } from '../utils/reactive';
import { grantAccess } from './grantAccess';
import { protectData } from './protectData';
import { protectDataObservable } from './protectDataObservable';
import { revokeAccess } from './revokeAccess';

export default class IExecDataProtector {
  protectData: (
    data: string | ArrayBuffer | Uint8Array | Buffer,
    name: string
  ) => Promise<any>;
  protectDataObservable: (
    data: string | ArrayBuffer | Uint8Array | Buffer,
    name: string
  ) => Observable;
  grantAccess: (args: IGrantOptions) => Promise<string>;
  revokeAccess: (args: IRevokeOptions) => Promise<string[]>;
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

    this.protectData = (
      data: string | ArrayBuffer | Uint8Array | Buffer,
      name: string
    ) => protectData({ data, name, iexec, ipfsNodeMultiaddr });

    this.protectDataObservable = (
      data: string | ArrayBuffer | Uint8Array | Buffer,
      name: string
    ) => protectDataObservable({ data, name, iexec, ipfsNodeMultiaddr });

    this.grantAccess = (args: IGrantOptions) => grantAccess({ ...args, iexec });

    this.revokeAccess = (args: IRevokeOptions) =>
      revokeAccess({ ...args, iexec });
  }
}
