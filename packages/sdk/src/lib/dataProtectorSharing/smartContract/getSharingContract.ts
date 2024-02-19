import { Contract } from 'ethers';
import { IExec } from 'iexec';
import { ABI as sharingABI } from '../../../contracts/sharingAbi.js';
import { AddressOrENS } from '../../types/commonTypes.js';

export async function getSharingContract(
  iexec: IExec,
  sharingContractAddress: AddressOrENS
): Promise<Contract> {
  const { provider, signer } = await iexec.config.resolveContractsClient();
  const sharingContract = new Contract(
    sharingContractAddress,
    sharingABI,
    provider
  );
  return sharingContract.connect(signer) as Contract;
}
