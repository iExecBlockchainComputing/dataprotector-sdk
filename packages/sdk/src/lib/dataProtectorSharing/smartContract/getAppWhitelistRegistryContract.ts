import { BaseContract, Contract } from 'ethers';
import { IExec } from 'iexec';
import { AppWhitelistRegistry } from '../../../../typechain/sharing-smart-contract/artifacts/contracts/registry/AppWhitelistRegistry.js';
import { ABI } from '../../../contracts/AppWhitelistRegistryABI.js';
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
