import { Contract } from 'ethers';
import { IExec } from 'iexec';
import { POCO_REGISTRY_CONTRACT_ADDRESS } from '../../../config/config.js';
import { ABI as pocoRegistryABI } from '../../../contracts/registryAbi.js';

export async function getPocoRegistryContract(iexec: IExec) {
  const { provider, signer } = await iexec.config.resolveContractsClient();
  const pocoRegistryContract = new Contract(
    POCO_REGISTRY_CONTRACT_ADDRESS,
    pocoRegistryABI,
    provider
  );
  return pocoRegistryContract.connect(signer) as Contract;
}
