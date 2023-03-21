import { Web3Provider } from '@ethersproject/providers';
import { IExec } from 'iexec';
import { createCNFT, authorize } from './confidentialNFT';
import { createCNFTWithObservable } from './confidentialNFTWithObservable';
import { Observable } from './reactive';
import {
  Addressish,
  BNish,
  HumanSingleTag,
  NRLCAmount,
  Tag,
} from 'iexec/dist/lib/types';

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
  constructor(
    ethProvider: any,
    { ipfsGateway, providerOptions = {}, iexecOptions = {} }: any = {}
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
    ) => createCNFT({ data, name, iexec, ipfsGateway });
    this.createCNFTwithObservable = (
      data: string | ArrayBuffer | Uint8Array | Buffer,
      name: string
    ) => createCNFTWithObservable({ data, name, iexec, ipfsGateway });

    this.authorizeConfidentialNFTUsage = (
      dataset: string,
      datasetprice?: number,
      volume?: number,
      tag?: string,
      apprestrict?: string,
      workerpoolrestrict?: string,
      requesterrestrict?: string
    ) =>
      authorize({
        iexec,
        dataset,
        datasetprice,
        volume,
        tag,
        apprestrict,
        workerpoolrestrict,
        requesterrestrict,
      });
  }
}
