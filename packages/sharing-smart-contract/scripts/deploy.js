/* eslint-disable no-console */
import pkg from 'hardhat';
import { POCO_PROTECTED_DATA_REGISTRY_ADDRESS, POCO_PROXY_ADDRESS } from '../config/config.js';
import { saveDeployment } from '../utils/utils.js';

const { ethers, upgrades } = pkg;

async function main() {
  console.log('Starting deployment...');
  const [deployer] = await ethers.getSigners();
  console.log('Deploying contracts with the account:', deployer.address);

  const AddOnlyAppWhitelistRegistryFactory = await ethers.getContractFactory('AddOnlyAppWhitelistRegistry');
  const addOnlyAppWhitelistRegistryContract = await upgrades.deployProxy(AddOnlyAppWhitelistRegistryFactory, {
    kind: 'transparent',
  });
  await addOnlyAppWhitelistRegistryContract.waitForDeployment();
  const addOnlyAppWhitelistRegistryAddress = await addOnlyAppWhitelistRegistryContract.getAddress();

  await saveDeployment('AddOnlyAppWhitelistRegistry')({
    address: addOnlyAppWhitelistRegistryAddress,
    args: '',
    block: addOnlyAppWhitelistRegistryContract.deploymentTransaction.blockNumber,
  });

  const DataProtectorSharingFactory = await ethers.getContractFactory('DataProtectorSharing');

  const dataProtectorSharingConstructorArgs = [
    POCO_PROXY_ADDRESS,
    POCO_PROTECTED_DATA_REGISTRY_ADDRESS,
    addOnlyAppWhitelistRegistryAddress,
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
    block: addOnlyAppWhitelistRegistryContract.deploymentTransaction.blockNumber,
  });

  console.log(`Proxy AddOnlyAppWhitelistRegistry address: ${addOnlyAppWhitelistRegistryAddress}`);
  console.log(`Proxy DataProtectorSharing address: ${proxyAddress}`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
