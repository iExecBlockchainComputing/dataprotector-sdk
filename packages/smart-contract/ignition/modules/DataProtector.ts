import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';
import { DATASET_REGISTRY_ADDRESS as defaultDatasetRegistryAddress } from '../../config/config';
import { env } from '../../config/env';

export default buildModule('DataProtectorModule', (m) => {
    // Get registry address from environment or default
    const datasetRegistryAddress = env.DATASET_REGISTRY_ADDRESS || defaultDatasetRegistryAddress;

    // Deploy DataProtector with the registry address as constructor argument
    const dataProtector = m.contract('DataProtector', [datasetRegistryAddress]);

    // Return the deployed contract
    return { dataProtector };
});
