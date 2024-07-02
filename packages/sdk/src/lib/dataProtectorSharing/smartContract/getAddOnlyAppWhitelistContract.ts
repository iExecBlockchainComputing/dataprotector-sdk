import { Contract } from 'ethers';
import type { IExecModule } from 'iexec';
import { ABI } from '../../../../generated/abis/sharing/registry/AddOnlyAppWhitelist.sol/AddOnlyAppWhitelist.js';
import type { AddOnlyAppWhitelist } from '../../../../generated/typechain/sharing/registry/AddOnlyAppWhitelist.js';
import type { Address } from '../../types/commonTypes.js';

export async function getAppWhitelistContract(
  iexec: IExecModule,
  addOnlyAppWhitelist: Address
): Promise<AddOnlyAppWhitelist> {
  const { signer } = await iexec.config.resolveContractsClient();
  return new Contract(addOnlyAppWhitelist, ABI).connect(
    signer
  ) as AddOnlyAppWhitelist;
}
