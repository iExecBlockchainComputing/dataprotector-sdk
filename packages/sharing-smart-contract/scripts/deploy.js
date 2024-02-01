import pkg from 'hardhat';
import { saveConstructorArgsParams, saveSmartContractAddress } from '../utils/utils.js';
import { POCO_PROXY_CONTRACT_ADDRESS, POCO_REGISTRY_CONTRACT_ADDRESS } from './config/config.js';

const { ethers } = pkg;

async function main() {
  console.log('Starting deployment...');
  const [deployer] = await ethers.getSigners();
  console.log('Deploying contracts with the account:', deployer.address);

  // pass the registry instance to the deploy method
  const ProtectedDataSharingFactory = await ethers.getContractFactory('ProtectedDataSharing');
  const protectedDataSharing = await ProtectedDataSharingFactory.deploy(
    POCO_PROXY_CONTRACT_ADDRESS,
    POCO_REGISTRY_CONTRACT_ADDRESS,
    deployer.address,
  );
  const deploymentTransaction = protectedDataSharing.deploymentTransaction();
  await deploymentTransaction?.wait();
  const protectedDataSharingAddress = await protectedDataSharing.getAddress();
  // save the smart contract address in `.smart-contract-address` file for next usages
  await saveSmartContractAddress(protectedDataSharingAddress);
  // save the constructor args params in `.constructor-args-params` file for next usages
  await saveConstructorArgsParams([
    POCO_PROXY_CONTRACT_ADDRESS,
    POCO_REGISTRY_CONTRACT_ADDRESS,
    deployer.address,
  ]);

  console.log('ProtectedDataSharing contract deployed to address:', protectedDataSharingAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
