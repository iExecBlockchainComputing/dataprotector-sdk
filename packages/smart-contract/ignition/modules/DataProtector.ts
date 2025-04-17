import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { DATASET_REGISTRY_ADDRESS as defaultDatasetRegistryAddress } from '../../config/config';
import { env } from '../../config/env';

export default buildModule("DataProtectorModule", (m) => {
  // Get registry address from environment or default
  const DATASET_REGISTRY_ADDRESS = env.DATASET_REGISTRY_ADDRESS || defaultDatasetRegistryAddress;
  
  // Deploy DataProtector with the registry address as constructor argument
  const dataProtector = m.contract("DataProtector", [DATASET_REGISTRY_ADDRESS]);

  // Return the deployed contract
  return { dataProtector };
});
