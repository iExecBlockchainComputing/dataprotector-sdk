/* eslint-disable no-console */
import pkg from 'hardhat';
import { POCO_PROTECTED_DATA_REGISTRY_ADDRESS, POCO_PROXY_ADDRESS } from '../config/config.js';
import { saveDeployment } from '../utils/utils.js';

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

  await saveDeployment('AppWhitelistRegistry')({
    address: appWhitelistRegistryAddress,
    args: '',
    block: appWhitelistRegistryContract.deploymentTransaction().blockNumber,
  });

  const DataProtectorSharingFactory = await ethers.getContractFactory('DataProtectorSharing');

  const dataProtectorSharingConstructorArgs = [
    POCO_PROXY_ADDRESS,
    POCO_PROTECTED_DATA_REGISTRY_ADDRESS,
    appWhitelistRegistryAddress,
  ];
  const dataProtectorSharingContract = await upgrades.deployProxy(DataProtectorSharingFactory, {
    kind: 'transparent',
    constructorArgs: dataProtectorSharingConstructorArgs,
  });
  await dataProtectorSharingContract.waitForDeployment();
  const proxyAddress = await dataProtectorSharingContract.getAddress();
  // initialize appWhitelistRegistryContract

  await saveDeployment('DataProtectorSharing')({
    address: proxyAddress,
    args: dataProtectorSharingConstructorArgs.join(' '),
    block: appWhitelistRegistryContract.deploymentTransaction().blockNumber,
  });

  console.log(`Proxy AppWhitelistRegistry address: ${appWhitelistRegistryAddress}`);
  console.log(`Proxy DataProtectorSharing address: ${proxyAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
