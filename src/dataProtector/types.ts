import IExec from 'iexec/dist/esm/lib/IExec';

export type ProtectDataOptions = {
  data: string | ArrayBuffer | Uint8Array | Buffer;
  name: string;
  iexec?: IExec;
  ipfsNodeMultiaddr?: string;
};

export type GrantAccessOptions = {
  iexec?: IExec;
  dataset: string;
  datasetprice?: number;
  volume?: number;
  tag?: string | string[];
  apprestrict?: string;
  workerpoolrestrict?: string;
  requesterrestrict?: string;
};

export type RevokeAccessOptions = {
  iexec?: IExec;
  dataset: string;
  apprestrict?: string;
  workerpoolrestrict?: string;
  requesterrestrict?: string;
};
