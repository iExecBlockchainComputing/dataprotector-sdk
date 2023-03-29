import { IExec } from 'iexec';
import { createCNFT } from './confidentialNFT';
import { createCNFTWithObservable } from './confidentialNFTWithObservable';
import { Observable } from './reactive';

export default class IExecPrivateDataProtector {
  createCNFT: (
    data: string | ArrayBuffer | Uint8Array | Buffer,
    name: string
  ) => Promise<any>;
  createCNFTwithObservable: (
    data: string | ArrayBuffer | Uint8Array | Buffer,
    name: string
  ) => Observable;
  constructor(
    ethProvider: any,
    { ipfsNodeMultiaddr, providerOptions = {}, iexecOptions = {} }: any = {}
  ) {
    let iexec: IExec;
    try {
      iexec = new IExec({ ethProvider }, { providerOptions, ...iexecOptions });
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
