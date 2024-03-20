import pkg from 'hardhat';
import {
  POCO_APP_REGISTRY_ADDRESS,
  POCO_PROTECTED_DATA_REGISTRY_ADDRESS,
  POCO_PROXY_ADDRESS,
} from '../config/config.js';
import { saveConstructorArgsParams, saveSmartContractAddress } from '../utils/utils.js';

const { ethers, upgrades } = pkg;

async function main() {
  console.log('Starting deployment...');
  const [deployer] = await ethers.getSigners();
  console.log('Deploying contracts with the account:', deployer.address);

  const AppWhitelistRegistryFactory = await ethers.getContractFactory('AppWhitelistRegistry');
  const appWhitelistRegistryContract = await upgrades.deployProxy(
    AppWhitelistRegistryFactory,
    {
      kind: 'transparent',
    },
  );
  await appWhitelistRegistryContract.waitForDeployment();
  const appWhitelistRegistryAddress = await appWhitelistRegistryContract.getAddress();

  const DataProtectorSharingFactory = await ethers.getContractFactory('DataProtectorSharing');
  const dataProtectorSharingContract = await upgrades.deployProxy(
    DataProtectorSharingFactory,
    [deployer.address],
    {
      kind: 'transparent',
      constructorArgs: [
        POCO_PROXY_ADDRESS,
        POCO_PROTECTED_DATA_REGISTRY_ADDRESS,
        appWhitelistRegistryAddress,
      ],
    },
  );
  await dataProtectorSharingContract.waitForDeployment();
  const proxyAddress = await dataProtectorSharingContract.getAddress();
  // initialize appWhitelistRegistryContract

  // save the smart contract address in `.smart-contract-address` file for next usages
  await saveSmartContractAddress(proxyAddress);
  // save the constructor args params in `.constructor-args-params` file for next usages
  await saveConstructorArgsParams([
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
