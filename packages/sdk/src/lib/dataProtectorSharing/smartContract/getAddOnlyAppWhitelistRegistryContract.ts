import { Contract } from 'ethers';
import type { IExecModule } from 'iexec';
import { ABI } from '../../../../generated/abis/sharing/registry/AddOnlyAppWhitelistRegistry.sol/AddOnlyAppWhitelistRegistry.js';
import type { AddOnlyAppWhitelistRegistry } from '../../../../generated/typechain/sharing/registry/AddOnlyAppWhitelistRegistry.js';
import type { Address } from '../../types/commonTypes.js';
import { getSharingContract } from './getSharingContract.js';

export async function getAppWhitelistRegistryContract(
  iexec: IExecModule,
  sharingContractAddress: Address
): Promise<AddOnlyAppWhitelistRegistry> {
  const { signer } = await iexec.config.resolveContractsClient();
  const sharingContract = await getSharingContract(
    iexec,
    sharingContractAddress
  );
  const appWhitelistRegistryContractAddress =
    await sharingContract.ADD_ONLY_APP_WHITELIST_REGISTRY();

  return new Contract(appWhitelistRegistryContractAddress, ABI).connect(
    signer
  ) as AddOnlyAppWhitelistRegistry;
}
