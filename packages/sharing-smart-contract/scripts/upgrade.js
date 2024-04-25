/* eslint-disable no-console */
import { getEnvironment } from '@iexec/dataprotector-environments';
import pkg from 'hardhat';
import { POCO_PROTECTED_DATA_REGISTRY_ADDRESS, POCO_PROXY_ADDRESS } from '../config/config.js';

const { ethers, upgrades } = pkg;

async function main() {
  const { ENV } = process.env;
  console.log(`using ENV: ${ENV}`);
  const { dataprotectorSharingContractAddress, AddOnlyAppWhitelistRegistryAddress } = getEnvironment(ENV);

  console.log('Starting deployment...');
  const [deployer] = await ethers.getSigners();
  console.log('Deploying contracts with the account:', deployer.address);

  const dataProtectorSharingConstructorArgs = [
    POCO_PROXY_ADDRESS,
    POCO_PROTECTED_DATA_REGISTRY_ADDRESS,
    AddOnlyAppWhitelistRegistryAddress,
  ];

  // pass the registry instance to the deploy method
  const DataProtectorSharingFactoryV2 = await ethers.getContractFactory('DataProtectorSharing');
  const proxyUpgrade = await upgrades.upgradeProxy(dataprotectorSharingContractAddress, DataProtectorSharingFactoryV2, {
    kind: 'transparent',
    constructorArgs: dataProtectorSharingConstructorArgs,
  });

  await proxyUpgrade.waitForDeployment();

  console.log(`Proxy address: ${dataprotectorSharingContractAddress}`);
  console.log(
    'NEW Implementation address (DataProtectorSharing.sol):',
    await upgrades.erc1967.getImplementationAddress(dataprotectorSharingContractAddress),
  );

  // Verify smart-contract
  try {
    await hre.run('verify:verify', {
      address: proxyUpgrade,
      constructorArguments: dataProtectorSharingConstructorArgs,
    });
  } catch (e) {
    console.log('Proxy verification for DataProtectorSharingContract may have failed :', e);
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
