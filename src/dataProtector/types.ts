import IExec from 'iexec/dist/esm/lib/IExec';

export type ProtectDataOptions = {
  data: string | ArrayBuffer | Uint8Array | Buffer;
  name: string;
  iexec?: IExec;
  ipfsNodeMultiaddr?: string;
};

export type GrantAccessOptions = {
  iexec?: IExec;
  dataAddress: string;
  appRestrictAddress?: string;
  requesterRestrictAddress?: string;
  dataUsagePrice?: number;
  numberOfAccess?: number;
  tag?: string | string[];
};

export type RevokeAccessOptions = {
  iexec?: IExec;
  dataset: string;
  apprestrict?: string;
  requesterrestrict?: string;
};
