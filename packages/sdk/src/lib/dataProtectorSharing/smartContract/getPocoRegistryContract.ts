import { Contract } from 'ethers';
import type { IExecModule } from 'iexec';
import { ABI } from '../../../../generated/abis/sharing/interfaces/IRegistry.sol/IRegistry.js';
import type { IRegistry } from '../../../../generated/typechain/sharing/interfaces/IRegistry.js';

export async function getPocoDatasetRegistryContract(
  iexec: IExecModule
): Promise<IRegistry> {
  const { signer, getIExecContract } =
    await iexec.config.resolveContractsClient();
  const poco = getIExecContract() as any;
  const datasetRegistryAddress = await poco.datasetregistry();
  return new Contract(datasetRegistryAddress, ABI).connect(signer) as IRegistry;
}

export async function getPocoAppRegistryContract(
  iexec: IExecModule
): Promise<IRegistry> {
  const { signer, getIExecContract } =
    await iexec.config.resolveContractsClient();
  const poco = getIExecContract() as any;
  const appRegistryAddress = await poco.appregistry();
  return new Contract(appRegistryAddress, ABI).connect(signer) as IRegistry;
}
