import { BN } from 'iexec';

export const bnToBigInt = (bn: BN): bigint => BigInt(bn.toString());
