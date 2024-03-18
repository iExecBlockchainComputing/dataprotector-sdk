import { BaseContract, Contract } from 'ethers';
import { IExec } from 'iexec';
import { DataProtectorSharing } from '../../../../typechain/sharing-smart-contract/artifacts/contracts/DataProtectorSharing.js';
import { ABI } from '../../../contracts/DataProtectorSharingABI.js';
import { Address } from '../../types/commonTypes.js';

export async function getSharingContract(
  iexec: IExec,
  sharingContractAddress: Address
): Promise<DataProtectorSharing> {
  const { signer } = await iexec.config.resolveContractsClient();
  return new Contract(
    sharingContractAddress,
    ABI,
    signer
  ) as BaseContract as DataProtectorSharing;
}
