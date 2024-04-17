import pkg from 'hardhat';
import { POCO_PROTECTED_DATA_REGISTRY_ADDRESS, POCO_PROXY_ADDRESS } from '../config/config.js';

const { ethers, upgrades } = pkg;
const proxyAddress = '...';
const addOnlyAppWhitelistRegistryAddress = '...';

async function main() {
  console.log('Starting deployment...');
  const [deployer] = await ethers.getSigners();
  console.log('Deploying contracts with the account:', deployer.address);

  // pass the registry instance to the deploy method
  const DataProtectorSharingFactoryV2 = await ethers.getContractFactory('DataProtectorSharing');
  const proxyUpgrade = await upgrades.upgradeProxy(proxyAddress, DataProtectorSharingFactoryV2, {
    kind: 'transparent',
    constructorArgs: [POCO_PROXY_ADDRESS, POCO_PROTECTED_DATA_REGISTRY_ADDRESS, addOnlyAppWhitelistRegistryAddress],
  });
  await proxyUpgrade.waitForDeployment();

  console.log(`Proxy address: ${proxyAddress}`);
  console.log(
    'NEW Implementation address (ProtectedDataSharing.sol):',
    await upgrades.erc1967.getImplementationAddress(proxyAddress),
  );
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
