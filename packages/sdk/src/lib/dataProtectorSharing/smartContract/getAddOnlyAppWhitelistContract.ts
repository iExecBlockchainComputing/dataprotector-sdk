import { Contract } from 'ethers';
import { IExec } from 'iexec';
import { ABI } from '../../../../generated/abis/sharing/registry/AddOnlyAppWhitelist.sol/AddOnlyAppWhitelist.js';
import { AddOnlyAppWhitelist } from '../../../../generated/typechain/sharing/registry/AddOnlyAppWhitelist.js';
import { Address } from '../../types/commonTypes.js';

export async function getAppWhitelistContract(
  iexec: IExec,
  addOnlyAppWhitelist: Address
): Promise<AddOnlyAppWhitelist> {
  const { signer } = await iexec.config.resolveContractsClient();
  return new Contract(addOnlyAppWhitelist, ABI).connect(
    signer
  ) as AddOnlyAppWhitelist;
}
