import { Contract } from 'ethers';
import type { IExecModule } from 'iexec';
import { ABI } from '../../../../generated/abis/sharing/DataProtectorSharing.sol/DataProtectorSharing.js';
import type { DataProtectorSharing } from '../../../../generated/typechain/sharing/DataProtectorSharing.js';
import { Address } from '../../types/commonTypes.js';

export async function getSharingContract(
  iexec: IExecModule,
  sharingContractAddress: Address
): Promise<DataProtectorSharing> {
  const { signer } = await iexec.config.resolveContractsClient();
  return new Contract(sharingContractAddress, ABI).connect(
    signer
  ) as DataProtectorSharing;
}
