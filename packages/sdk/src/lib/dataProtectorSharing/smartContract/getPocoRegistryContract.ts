import { Contract } from 'ethers';
import type { IExec } from 'iexec';
import { IRegistry } from '../../../../typechain/sharing-smart-contract/artifacts/contracts/interfaces/IRegistry.js';
import {
  POCO_APP_REGISTRY_CONTRACT_ADDRESS,
  POCO_DATASET_REGISTRY_CONTRACT_ADDRESS,
} from '../../../config/config.js';
import { ABI } from '../../../contracts/PocoRegistryABI.js';

export async function getPocoDatasetRegistryContract(
  iexec: IExec
): Promise<IRegistry> {
  const { signer } = await iexec.config.resolveContractsClient();
  return new Contract(
    POCO_DATASET_REGISTRY_CONTRACT_ADDRESS,
    ABI,
    signer
  ) as unknown as IRegistry;
}

export async function getPocoAppRegistryContract(
  iexec: IExec
): Promise<IRegistry> {
  const { signer } = await iexec.config.resolveContractsClient();
  return new Contract(
    POCO_APP_REGISTRY_CONTRACT_ADDRESS,
    ABI,
    signer
  ) as unknown as IRegistry;
}
