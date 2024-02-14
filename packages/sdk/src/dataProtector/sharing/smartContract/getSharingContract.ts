import { Contract } from 'ethers';
import type { IExec } from 'iexec';
import { ABI as sharingABI } from '../../../contracts/sharingAbi.js';
import type { Address } from '../../types/index.js';

let iexec: IExec;
let sharingContractAddress: Address;

export function saveForSharingContract(
  iexecRef: IExec,
  contractAddress: Address
) {
  iexec = iexecRef;
  sharingContractAddress = contractAddress;
}

export async function getSharingContract(): Promise<Contract> {
  const { provider, signer } = await iexec.config.resolveContractsClient();
  const sharingContract = new Contract(
    sharingContractAddress,
    sharingABI,
    provider
  );
  return sharingContract.connect(signer) as Contract;
}
