import { Contract } from 'ethers';
import type { IExec } from 'iexec';
import { ABI as sharingABI } from '../../../contracts/sharingAbi.js';

export async function getSharingContract(
  iexec: IExec,
  sharingContractAddress: string
): Promise<Contract> {
  const { provider, signer } = await iexec.config.resolveContractsClient();
  const sharingContract = new Contract(
    sharingContractAddress,
    sharingABI,
    provider
  );
  return sharingContract.connect(signer) as Contract;
}
