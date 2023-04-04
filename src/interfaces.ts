import IExec from 'iexec/dist/esm/lib/IExec';

export interface IProtectDataOptions {
  iexec: IExec;
  data: string | ArrayBuffer | Uint8Array | Buffer;
  name: string;
  ipfsNodeMultiaddr?: string;
}

interface IGrantAccessOptions {
  dataset: string;
  datasetprice?: number;
  volume?: number;
  tag?: string | string[];
  apprestrict?: string;
  workerpoolrestrict?: string;
  requesterrestrict?: string;
}

interface IRevokeAccessOptions {
  dataset: string;
  apprestrict?: string;
  workerpoolrestrict?: string;
  requesterrestrict?: string;
}

export type IGrantOptions = IGrantAccessOptions & { iexec?: IExec };
export type IRevokeOptions = IRevokeAccessOptions & { iexec?: IExec };
