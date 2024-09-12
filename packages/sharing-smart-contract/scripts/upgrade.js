/* eslint-disable no-console */
import hre from 'hardhat';
import {
  DATASET_REGISTRY_ADDRESS as defaultDatasetRegistryAddress,
  POCO_ADDRESS as defaultPocoAddress,
} from '../config/config.js';
import { VOUCHER_HUB_ADDRESS } from '../test/bellecour-fork/voucher-config.js';
import { getLoadFromEnv } from './singleFunction/utils.js';

const { ethers, upgrades } = hre;

async function main() {
  const { ENV } = process.env;
  const loadFromEnv = getLoadFromEnv(ENV);

  const {
    DATAPROTECTOR_SHARING_ADDRESS = loadFromEnv('dataprotectorSharingContractAddress'),
    ADD_ONLY_APP_WHITELIST_REGISTRY_ADDRESS = loadFromEnv('addOnlyAppWhitelistRegistryContractAddress'),
    POCO_ADDRESS = defaultPocoAddress,
    DATASET_REGISTRY_ADDRESS = defaultDatasetRegistryAddress,
  } = process.env;

  console.log(`Using poco at ${POCO_ADDRESS}`);
  console.log(`Using dataset registry at ${DATASET_REGISTRY_ADDRESS}`);
  console.log(`Using voucher hub at ${VOUCHER_HUB_ADDRESS}`);

  console.log('Starting upgrade...');
  const [deployer] = await ethers.getSigners();

  console.log('Deploying contracts with the account:', deployer.address);
  console.log(`Upgrading proxy at address: ${DATAPROTECTOR_SHARING_ADDRESS}`);

  const dataProtectorSharingConstructorArgs = [
    POCO_ADDRESS,
    DATASET_REGISTRY_ADDRESS,
    ADD_ONLY_APP_WHITELIST_REGISTRY_ADDRESS,
    VOUCHER_HUB_ADDRESS,
  ];

  // pass the registry instance to the deploy method
  const DataProtectorSharingFactoryV2 = await ethers.getContractFactory('DataProtectorSharing');
  const proxyUpgrade = await upgrades.upgradeProxy(DATAPROTECTOR_SHARING_ADDRESS, DataProtectorSharingFactoryV2, {
    kind: 'transparent',
    constructorArgs: dataProtectorSharingConstructorArgs,
  });

  const upgradeTx = proxyUpgrade.deployTransaction;
  console.log(`Upgrade tx ${upgradeTx.hash}`);
  // wait for upgrade
  await upgradeTx.wait();

  const implementationAddress = await upgrades.erc1967.getImplementationAddress(DATAPROTECTOR_SHARING_ADDRESS);
  console.log('New implementation address (DataProtectorSharing.sol):', implementationAddress);

  // Verify smart-contract
  try {
    await hre.run('verify:verify', {
      address: implementationAddress,
      constructorArguments: dataProtectorSharingConstructorArgs,
    });
  } catch (e) {
    console.log('New implementation verification for DataProtectorSharing may have failed :', e);
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
