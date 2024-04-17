/* eslint-disable no-console */
import pkg from 'hardhat';
import { getEnvironment } from '../../../environments/esm/environments.js';

const { ethers, upgrades } = pkg;

async function main() {
  const { ENV } = process.env;
  console.log(`using ENV: ${ENV}`);
  const { DataProtectorSharingContractAddress } = getEnvironment(ENV);

  console.log('Starting deployment...');
  const [deployer] = await ethers.getSigners();
  console.log('Deploying contracts with the account:', deployer.address);

  // pass the registry instance to the deploy method
  const ProtectedDataSharingFactoryV2 = await ethers.getContractFactory('ProtectedDataSharing');
  const proxyUpgrade = await upgrades.upgradeProxy(
    DataProtectorSharingContractAddress,
    ProtectedDataSharingFactoryV2,
    {
      kind: 'transparent',
    },
  );
  await proxyUpgrade.waitForDeployment();

  console.log(`Proxy address: ${DataProtectorSharingContractAddress}`);
  console.log(
    'Implementation address (ProtectedDataSharing.sol):',
    await upgrades.erc1967.getImplementationAddress(DataProtectorSharingContractAddress),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
