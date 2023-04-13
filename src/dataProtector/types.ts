import IExec from 'iexec/dist/esm/lib/IExec';
import { Tag } from 'iexec/dist/esm/lib/types';

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

export type Order = {
  dataset: string;
  datasetprice: number;
  volume: number;
  tag: Tag;
  apprestrict: string;
  workerpoolrestrict: string;
  requesterrestrict: string;
  salt: string;
  sign: string;
};
