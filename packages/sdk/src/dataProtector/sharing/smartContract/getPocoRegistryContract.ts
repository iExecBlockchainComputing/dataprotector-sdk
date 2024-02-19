import { Contract } from 'ethers';
import type { IExec } from 'iexec';
import {
  POCO_APP_REGISTRY_CONTRACT_ADDRESS,
  POCO_DATASET_REGISTRY_CONTRACT_ADDRESS,
} from '../../../config/config.js';
import { ABI as pocoRegistryABI } from '../../../contracts/registryAbi.js';

let iexec: IExec;

export function saveForPocoRegistryContract(iexecRef: IExec) {
  iexec = iexecRef;
}

export async function getPocoDatasetRegistryContract() {
  const { provider, signer } = await iexec.config.resolveContractsClient();
  const pocoRegistryContract = new Contract(
    POCO_DATASET_REGISTRY_CONTRACT_ADDRESS,
    pocoRegistryABI,
    provider
  );
  return pocoRegistryContract.connect(signer) as Contract;
}

export async function getPocoAppRegistryContract() {
  const { provider, signer } = await iexec.config.resolveContractsClient();
  const pocoRegistryContract = new Contract(
    POCO_APP_REGISTRY_CONTRACT_ADDRESS,
    pocoRegistryABI,
    provider
  );
  return pocoRegistryContract.connect(signer) as Contract;
}
