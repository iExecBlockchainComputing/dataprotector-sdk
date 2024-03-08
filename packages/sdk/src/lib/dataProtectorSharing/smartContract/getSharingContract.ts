import { BaseContract, Contract } from 'ethers';
import { IExec } from 'iexec';
import { ProtectedDataSharing } from '../../../../typechain/sharing-smart-contract/artifacts/contracts/ProtectedDataSharing.js';
import { ABI } from '../../../contracts/ProtectedDataSharingABI.js';
import { AddressOrENS } from '../../types/commonTypes.js';

export async function getSharingContract(
  iexec: IExec,
  sharingContractAddress: AddressOrENS
): Promise<ProtectedDataSharing> {
  const { signer } = await iexec.config.resolveContractsClient();
  return new Contract(
    sharingContractAddress,
    ABI,
    signer
  ) as BaseContract as ProtectedDataSharing;
}
