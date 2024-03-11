import type { IExec } from 'iexec';
import { IRegistry__factory } from '../../../../typechain/factories/sharing-smart-contract/artifacts/contracts/interfaces/IRegistry__factory.js';
import { IRegistry } from '../../../../typechain/sharing-smart-contract/artifacts/contracts/interfaces/IRegistry.js';
import {
  POCO_APP_REGISTRY_CONTRACT_ADDRESS,
  POCO_DATASET_REGISTRY_CONTRACT_ADDRESS,
} from '../../../config/config.js';

export async function getPocoDatasetRegistryContract(
  iexec: IExec
): Promise<IRegistry> {
  const { signer } = await iexec.config.resolveContractsClient();
  return IRegistry__factory.connect(
    POCO_DATASET_REGISTRY_CONTRACT_ADDRESS,
    signer
  );
}

export async function getPocoAppRegistryContract(
  iexec: IExec
): Promise<IRegistry> {
  const { signer } = await iexec.config.resolveContractsClient();
  return IRegistry__factory.connect(POCO_APP_REGISTRY_CONTRACT_ADDRESS, signer);
}
