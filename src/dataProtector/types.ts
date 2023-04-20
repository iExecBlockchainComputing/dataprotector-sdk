import IExec from 'iexec/dist/esm/lib/IExec';
import { Tag } from 'iexec/dist/esm/lib/types';

export type IExecConsumer = {
  iexec: IExec;
};

export type ProtectDataOptions = {
  object: Record<string, unknown>;
  ethersProvider?: any;
  ipfsNodeMultiaddr?: string;
  ipfsGateway?: string;
};

export type GrantAccessOptions = {
  dataAddress: string;
  appRestrictAddress?: string;
  requesterRestrictAddress?: string;
  dataUsagePrice?: number;
  numberOfAccess?: number;
  tag?: string | string[];
};

export type RevokeAccessOptions = {
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
