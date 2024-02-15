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

  // pass the registry instance to the deploy method
  const ProtectedDataSharingFactory = await ethers.getContractFactory('ProtectedDataSharing');
  const proxy = await upgrades.deployProxy(ProtectedDataSharingFactory, [deployer.address], {
    kind: 'transparent',
    constructorArgs: [
      POCO_PROXY_ADDRESS,
      POCO_APP_REGISTRY_ADDRESS,
      POCO_PROTECTED_DATA_REGISTRY_ADDRESS,
    ],
  });
  await proxy.waitForDeployment();

  const proxyAddress = await proxy.getAddress();
  // save the smart contract address in `.smart-contract-address` file for next usages
  await saveSmartContractAddress(proxyAddress);
  // save the constructor args params in `.constructor-args-params` file for next usages
  await saveConstructorArgsParams([
    POCO_PROXY_ADDRESS,
    POCO_APP_REGISTRY_ADDRESS,
    POCO_PROTECTED_DATA_REGISTRY_ADDRESS,
    deployer.address,
  ]);
  console.log(`Proxy address: ${proxyAddress}`);
  console.log(
    'Implementation address (ProtectedDataSharing.sol):',
    await upgrades.erc1967.getImplementationAddress(proxyAddress),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
