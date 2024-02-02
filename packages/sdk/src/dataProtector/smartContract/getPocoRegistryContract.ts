import { Contract } from 'ethers';
import type { IExec } from 'iexec';
import { POCO_REGISTRY_CONTRACT_ADDRESS } from '../../config/config.js';
import { ABI as pocoRegistryABI } from '../../contracts/registryAbi.js';

let iexec: IExec;

export function saveForPocoRegistryContract(iexecRef: IExec) {
  iexec = iexecRef;
}

export async function getPocoRegistryContract() {
  const { provider, signer } = await iexec.config.resolveContractsClient();
  const pocoRegistryContract = new Contract(
    POCO_REGISTRY_CONTRACT_ADDRESS,
    pocoRegistryABI,
    provider
  );
  return pocoRegistryContract.connect(signer) as Contract;
}
