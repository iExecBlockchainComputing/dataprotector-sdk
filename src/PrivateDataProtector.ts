import { Web3Provider } from '@ethersproject/providers';
import { IExec } from 'iexec';
import { createCNFT, authorize, revoke } from './confidentialNFT';
import { createCNFTWithObservable } from './confidentialNFTWithObservable';
import { Observable } from './reactive';
import { HumanSingleTag, Tag } from 'iexec/dist/lib/types';

export default class IExecPrivateDataProtector {
  createCNFT: (
    data: string | ArrayBuffer | Uint8Array | Buffer,
    name: string
  ) => Promise<any>;
  createCNFTwithObservable: (
    data: string | ArrayBuffer | Uint8Array | Buffer,
    name: string
  ) => Observable;
  authorizeConfidentialNFTUsage: (
    dataset: string,
    datasetprice?: number,
    volume?: number,
    tag?: Tag | HumanSingleTag[],
    apprestrict?: string,
    workerpoolrestrict?: string,
    requesterrestrict?: string
  ) => Promise<string>;
  revokeConfidentialNFTUsage: (
    dataset: string,
    appAddress: string
  ) => Promise<string>;
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

    this.createCNFT = (
      data: string | ArrayBuffer | Uint8Array | Buffer,
      name: string
    ) => createCNFT({ data, name, iexec, ipfsNodeMultiaddr });
    this.createCNFTwithObservable = (
      data: string | ArrayBuffer | Uint8Array | Buffer,
      name: string
    ) => createCNFTWithObservable({ data, name, iexec, ipfsNodeMultiaddr });
  }
}
