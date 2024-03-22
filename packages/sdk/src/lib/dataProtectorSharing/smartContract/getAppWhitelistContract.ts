import { BaseContract, Contract } from 'ethers';
import { IExec } from 'iexec';
import { ABI } from '../../../../generated/abis/sharing/registry/AppWhitelist.sol/AppWhitelist.js';
import { AppWhitelist } from '../../../../generated/typechain/sharing/registry/AppWhitelist.js';
import { Address } from '../../types/commonTypes.js';

export async function getAppWhitelistContract(
  iexec: IExec,
  appWhitelist: Address
): Promise<AppWhitelist> {
  const { signer } = await iexec.config.resolveContractsClient();
  return new Contract(
    appWhitelist,
    ABI,
    signer
  ) as BaseContract as AppWhitelist;
}
