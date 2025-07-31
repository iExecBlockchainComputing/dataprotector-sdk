import { GrantedAccess } from '../lib/types/index.js';

export const formatGrantedAccess = (order: {
  dataset: string;
  datasetprice: number | string;
  volume: number | string;
  tag: string;
  apprestrict: string;
  workerpoolrestrict: string;
  requesterrestrict: string;
  salt: string;
  sign: string;
}, remaining?: number): GrantedAccess => {
  const formattedOrder = Object.fromEntries(
    Object.entries(order).map(([key, val]) => [
      key,
      val.toString().toLowerCase(),
    ]) // stringify numbers and lowercase addresses to return a clean GrantedAccess
  ) as Omit<GrantedAccess, 'remainingAccess'>;
  
  return {
    ...formattedOrder,
    remainingAccess: remaining || 0,
  };
};
