import { IExec } from 'iexec';
import { getContract } from 'viem';
import { ABI as sharingABI } from '../../../contracts/sharingAbi.js';
import { AddressOrENS } from '../../types/commonTypes.js';
import { publicClient, walletClient } from './client.js';

export async function getSharingContract(
  iexec: IExec,
  sharingContractAddress: AddressOrENS
) {
  return getContract({
    address: sharingContractAddress as `0x${string}`,
    abi: sharingABI,
    client: {
      public: publicClient,
      wallet: walletClient,
    },
  });
}
