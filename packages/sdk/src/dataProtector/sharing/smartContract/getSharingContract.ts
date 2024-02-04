import { Contract } from 'ethers';
import type { IExec } from 'iexec';
import { ABI as sharingABI } from '../../../contracts/sharingAbi.js';
import type { AddressOrENS } from '../../types.js';

let iexec: IExec;
let sharingContractAddress: AddressOrENS;

export function saveForSharingContract(
  iexecRef: IExec,
  contractAddress: AddressOrENS
) {
  iexec = iexecRef;
  sharingContractAddress = contractAddress;
}

export async function getSharingContract() {
  const { provider, signer } = await iexec.config.resolveContractsClient();
  const sharingContract = new Contract(
    sharingContractAddress,
    sharingABI,
    provider
  );
  return sharingContract.connect(signer) as Contract;
}
