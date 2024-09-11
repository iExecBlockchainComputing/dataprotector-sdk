import { GrantedAccess } from '../lib/types/index.js';

export const formatGrantedAccess = (order: {
  datasetprice: number | string;
  volume: number | string;
  tag: string;
  apprestrict: string;
  workerpoolrestrict: string;
  requesterrestrict: string;
  salt: string;
  sign: string;
}): GrantedAccess =>
  Object.fromEntries(
    Object.entries(order).map(([key, val]) => [
      key,
      val.toString().toLowerCase(),
    ]) // stringify numbers and lowercase addresses to return a clean GrantedAccess
  ) as GrantedAccess;
