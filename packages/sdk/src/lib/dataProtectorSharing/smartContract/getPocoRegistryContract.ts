import { Contract } from 'ethers';
import type { IExec } from 'iexec';
import { ABI } from '../../../../generated/abis/sharing/interfaces/IRegistry.sol/IRegistry.js';
import { IRegistry } from '../../../../generated/typechain/sharing/interfaces/IRegistry.js';
import {
  POCO_APP_REGISTRY_CONTRACT_ADDRESS,
  POCO_DATASET_REGISTRY_CONTRACT_ADDRESS,
} from '../../../config/config.js';

export async function getPocoDatasetRegistryContract(
  iexec: IExec
): Promise<IRegistry> {
  const { signer } = await iexec.config.resolveContractsClient();
  return new Contract(POCO_DATASET_REGISTRY_CONTRACT_ADDRESS, ABI).connect(
    signer
  ) as IRegistry;
}

export async function getPocoAppRegistryContract(
  iexec: IExec
): Promise<IRegistry> {
  const { signer } = await iexec.config.resolveContractsClient();
  return new Contract(POCO_APP_REGISTRY_CONTRACT_ADDRESS, ABI).connect(
    signer
  ) as IRegistry;
}
