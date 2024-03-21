import { BaseContract, Contract } from 'ethers';
import { IExec } from 'iexec';
import { AppWhitelist } from '../../../../typechain/sharing-smart-contract/artifacts/contracts/registry/AppWhitelist.sol/AppWhitelist.js';
import { ABI } from '../../../contracts/AppWhitelistABI.js';
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
