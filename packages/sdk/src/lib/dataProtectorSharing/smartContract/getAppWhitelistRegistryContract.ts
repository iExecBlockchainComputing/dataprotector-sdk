import { BaseContract, Contract } from 'ethers';
import { IExec } from 'iexec';
import { ABI } from '../../../../generated/abis/sharing/registry/AppWhitelistRegistry.sol/AppWhitelistRegistry.js';
import { AppWhitelistRegistry } from '../../../../generated/typechain/sharing/registry/AppWhitelistRegistry.js';
import { Address } from '../../types/commonTypes.js';
import { getSharingContract } from './getSharingContract.js';

export async function getAppWhitelistRegistryContract(
  iexec: IExec,
  sharingContractAddress: Address
): Promise<AppWhitelistRegistry> {
  const { signer } = await iexec.config.resolveContractsClient();
  const sharingContract = await getSharingContract(
    iexec,
    sharingContractAddress
  );
  const appWhitelistRegistryContractAddress =
    await sharingContract.appWhitelistRegistry();

  return new Contract(
    appWhitelistRegistryContractAddress,
    ABI,
    signer
  ) as BaseContract as AppWhitelistRegistry;
}
