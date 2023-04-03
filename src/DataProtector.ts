import { Web3Provider } from '@ethersproject/providers';
import { IExec } from 'iexec';
import {
  protectData,
  protectDataObservable,
  grantAccess,
  revokeAccess,
} from './dataProtectorOperations';
import { Observable } from './reactive';
import { HumanSingleTag, Tag } from 'iexec/dist/lib/types';

export default class IExecDataProtector {
  protectData: (
    data: string | ArrayBuffer | Uint8Array | Buffer,
    name: string
  ) => Promise<any>;
  protectDataObservable: (
    data: string | ArrayBuffer | Uint8Array | Buffer,
    name: string
  ) => Observable;
  grantAccess: (
    dataset: string,
    datasetprice?: number,
    volume?: number,
    tag?: Tag | HumanSingleTag[],
    apprestrict?: string,
    workerpoolrestrict?: string,
    requesterrestrict?: string
  ) => Promise<string>;
  revokeAccess: (dataset: string, appAddress: string) => Promise<string>;
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
    this.grantAccess = (
      dataset: string,
      datasetprice?: number,
      volume?: number,
      tag?: Tag | HumanSingleTag[],
      apprestrict?: string,
      workerpoolrestrict?: string,
      requesterrestrict?: string
    ) =>
      grantAccess({
        iexec,
        dataset,
        datasetprice,
        volume,
        tag,
        apprestrict,
        workerpoolrestrict,
        requesterrestrict,
      });
    this.revokeAccess = (dataset: string, appAddress: string) =>
      revokeAccess({ iexec, dataset, appAddress });
  }
}
