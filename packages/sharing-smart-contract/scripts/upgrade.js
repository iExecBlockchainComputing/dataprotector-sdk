/* eslint-disable no-console */
import pkg from 'hardhat';
// eslint-disable-next-line import/no-extraneous-dependencies
import { getEnvironment } from 'environments';
import { POCO_PROTECTED_DATA_REGISTRY_ADDRESS, POCO_PROXY_ADDRESS } from '../config/config.js';

const { ethers, upgrades } = pkg;

async function main() {
  const { ENV } = process.env;
  console.log(`using ENV: ${ENV}`);
  const { DataProtectorSharingContractAddress, AddOnlyAppWhitelistRegistryAddress } = getEnvironment(ENV);

  console.log('Starting deployment...');
  const [deployer] = await ethers.getSigners();
  console.log('Deploying contracts with the account:', deployer.address);

  // pass the registry instance to the deploy method

  const DataProtectorSharingFactoryV2 = await ethers.getContractFactory('DataProtectorSharing');
  const proxyUpgrade = await upgrades.upgradeProxy(DataProtectorSharingContractAddress, DataProtectorSharingFactoryV2, {
    kind: 'transparent',
    constructorArgs: [POCO_PROXY_ADDRESS, POCO_PROTECTED_DATA_REGISTRY_ADDRESS, AddOnlyAppWhitelistRegistryAddress],
  });

  await proxyUpgrade.waitForDeployment();

  console.log(`Proxy address: ${DataProtectorSharingContractAddress}`);
  console.log(
    'NEW Implementation address (DataProtectorSharing.sol):',
    await upgrades.erc1967.getImplementationAddress(DataProtectorSharingContractAddress),
  );
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
