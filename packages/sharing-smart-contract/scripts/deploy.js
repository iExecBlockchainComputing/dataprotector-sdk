/* eslint-disable no-console */
import hre from 'hardhat';
import {
  DATASET_REGISTRY_ADDRESS as defaultDatasetRegistryAddress,
  POCO_ADDRESS as defaultPocoAddress,
} from '../config/config.js';
import { saveDeployment } from '../utils/utils.js';

const { ethers, upgrades } = hre;

async function main() {
  console.log('Starting deployment...');
  const [deployer] = await ethers.getSigners();
  console.log('Deploying contracts with the account:', deployer.address);

  const { POCO_ADDRESS = defaultPocoAddress, DATASET_REGISTRY_ADDRESS = defaultDatasetRegistryAddress } = process.env;

  console.log(`Using poco at ${POCO_ADDRESS}`);
  console.log(`Using dataset registry at ${DATASET_REGISTRY_ADDRESS}`);

  const AddOnlyAppWhitelistRegistryFactory = await ethers.getContractFactory('AddOnlyAppWhitelistRegistry');
  const addOnlyAppWhitelistRegistryContract = await upgrades.deployProxy(AddOnlyAppWhitelistRegistryFactory, {
    kind: 'transparent',
  });
  await addOnlyAppWhitelistRegistryContract.waitForDeployment();
  const addOnlyAppWhitelistRegistryAddress = await addOnlyAppWhitelistRegistryContract.getAddress();

  const deployAddOnlyAppWhitelistRegistryTxReceipt = await addOnlyAppWhitelistRegistryContract
    .deploymentTransaction()
    .wait();

  await saveDeployment('AddOnlyAppWhitelistRegistry')({
    address: addOnlyAppWhitelistRegistryAddress,
    args: '',
    block: deployAddOnlyAppWhitelistRegistryTxReceipt.blockNumber,
  });

  const DataProtectorSharingFactory = await ethers.getContractFactory('DataProtectorSharing');

  const dataProtectorSharingConstructorArgs = [
    DATASET_REGISTRY_ADDRESS,
    POCO_ADDRESS,
    addOnlyAppWhitelistRegistryAddress,
  ];
  const dataProtectorSharingContract = await upgrades.deployProxy(DataProtectorSharingFactory, {
    kind: 'transparent',
    constructorArgs: dataProtectorSharingConstructorArgs,
  });
  await dataProtectorSharingContract.waitForDeployment();
  const proxyAddress = await dataProtectorSharingContract.getAddress();

  const deployDataProtectorSharingTxReceipt = await dataProtectorSharingContract.deploymentTransaction().wait();

  await saveDeployment('DataProtectorSharing')({
    address: proxyAddress,
    args: dataProtectorSharingConstructorArgs.join(' '),
    block: deployDataProtectorSharingTxReceipt.blockNumber,
  });

  console.log(`Proxy AddOnlyAppWhitelistRegistry address: ${addOnlyAppWhitelistRegistryAddress}`);
  console.log(`Proxy DataProtectorSharing address: ${proxyAddress}`);

  // Verify smart-contract
  try {
    await hre.run('verify:verify', {
      address: addOnlyAppWhitelistRegistryAddress,
    });
  } catch (e) {
    console.log('Proxy verification for AppWhitelistRegistryContract may have failed :', e);
  }
  try {
    await hre.run('verify:verify', {
      address: proxyAddress,
    });
  } catch (e) {
    console.log('Proxy verification for DataProtectorSharingContract may have failed :', e);
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
