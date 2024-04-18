import pkg from 'hardhat';
import {
  POCO_APP_REGISTRY_ADDRESS,
  POCO_PROTECTED_DATA_REGISTRY_ADDRESS,
  POCO_PROXY_ADDRESS,
} from '../config/config.js';
import {
  saveAppWhitelistRegistryConstructorArgsParams,
  saveAppWhitelistRegistryContractAddress,
  saveDataProtectorSharingConstructorArgsParams,
  saveDataProtectorSharingContractAddress,
} from '../utils/utils.js';

const { ethers, upgrades } = pkg;

async function main() {
  console.log('Starting deployment...');
  const [deployer] = await ethers.getSigners();
  console.log('Deploying contracts with the account:', deployer.address);

  const AppWhitelistRegistryFactory = await ethers.getContractFactory('AppWhitelistRegistry');
  const appWhitelistRegistryContract = await upgrades.deployProxy(AppWhitelistRegistryFactory, {
    kind: 'transparent',
  });
  await appWhitelistRegistryContract.waitForDeployment();
  const appWhitelistRegistryAddress = await appWhitelistRegistryContract.getAddress();

  // save the smart contract address in `AppWhitelistRegistry.smart-contract-address` file for next usages
  await saveAppWhitelistRegistryContractAddress(appWhitelistRegistryAddress);
  // save the constructor args params in `AppWhitelistRegistry.constructor-args-params` file for next usages
  await saveAppWhitelistRegistryConstructorArgsParams([deployer.address]);

  const DataProtectorSharingFactory = await ethers.getContractFactory('DataProtectorSharing');
  const dataProtectorSharingContract = await upgrades.deployProxy(DataProtectorSharingFactory, {
    kind: 'transparent',
    constructorArgs: [
      POCO_PROXY_ADDRESS,
      POCO_PROTECTED_DATA_REGISTRY_ADDRESS,
      appWhitelistRegistryAddress,
    ],
  });
  await dataProtectorSharingContract.waitForDeployment();
  const proxyAddress = await dataProtectorSharingContract.getAddress();
  // initialize appWhitelistRegistryContract

  // save the smart contract address in `DataProtectorSharing.smart-contract-address` file for next usages
  await saveDataProtectorSharingContractAddress(proxyAddress);
  // save the constructor args params in `DataProtectorSharing.constructor-args-params` file for next usages
  await saveDataProtectorSharingConstructorArgsParams([
    POCO_PROXY_ADDRESS,
    POCO_APP_REGISTRY_ADDRESS,
    POCO_PROTECTED_DATA_REGISTRY_ADDRESS,
    appWhitelistRegistryAddress,
    deployer.address,
  ]);
  console.log(`Proxy AppWhitelistRegistry address: ${appWhitelistRegistryAddress}`);
  console.log(`Proxy DataProtectorSharing address: ${proxyAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
