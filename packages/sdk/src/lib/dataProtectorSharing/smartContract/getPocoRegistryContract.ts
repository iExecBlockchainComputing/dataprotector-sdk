import type { IExec } from 'iexec';
import {
  POCO_APP_REGISTRY_CONTRACT_ADDRESS,
  POCO_DATASET_REGISTRY_CONTRACT_ADDRESS,
} from '../../../config/config.js';
import {
  IRegistry,
  IRegistry__factory as IRegistryFactory,
} from '../../../../typechain/index.js';

export async function getPocoDatasetRegistryContract(
  iexec: IExec
): Promise<IRegistry> {
  const { signer } = await iexec.config.resolveContractsClient();
  return IRegistryFactory.connect(
    POCO_DATASET_REGISTRY_CONTRACT_ADDRESS,
    signer
  );
}

export async function getPocoAppRegistryContract(
  iexec: IExec
): Promise<IRegistry> {
  const { signer } = await iexec.config.resolveContractsClient();
  return IRegistryFactory.connect(POCO_APP_REGISTRY_CONTRACT_ADDRESS, signer);
}
