import { ethers } from 'ethers';
import { IExec } from 'iexec';
import { HumanSingleTag, Tag } from 'iexec/dist/lib/types';
import { NETWORK } from './conf';
import { authorize, revoke } from './confidentialNFT';
import { protectData } from './confidentialNFTWithObservable';
import { Observable } from './reactive';

interface dataset {
  dataset: string;
  datasetprice?: number;
  volume?: number;
  tag?: Tag | HumanSingleTag[];
  apprestrict?: string;
  workerpoolrestrict?: string;
  requesterrestrict?: string;
}

interface revokeAccess {
  dataset: string;
  apprestrict?: string;
  workerpoolrestrict?: string;
  requesterrestrict?: string;
}

export default class IExecPrivateDataProtector {
  protectData: (object: Record<string, unknown>) => Observable;
  authorizeConfidentialNFTUsage: (args: dataset) => Promise<string>;
  revokeConfidentialNFTUsage: (args: revokeAccess) => Promise<string[]>;

  constructor(
    ethProvider: any,
    {
      ipfsNodeMultiaddr,
      ipfsGateway,
      providerOptions = {},
      iexecOptions = {},
    }: any = {}
  ) {
    let iexec: IExec;
    let ethersProvider: any;
    try {
      ethersProvider = new ethers.providers.Web3Provider(ethProvider, NETWORK);
      iexec = new IExec({ ethProvider }, { providerOptions, ...iexecOptions });
    } catch (e) {
      throw Error('Unsupported ethProvider');
    }

    this.protectData = (object: Record<string, unknown>) =>
      protectData({
        object,
        ethersProvider,
        iexec,
        ipfsNodeMultiaddr,
        ipfsGateway,
      });
    this.authorizeConfidentialNFTUsage = (args: dataset) =>
      authorize({ ...args, iexec });
    this.revokeConfidentialNFTUsage = (args: revokeAccess) =>
      revoke({ ...args, iexec });
  }
}
