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

  const AppWhitelistRegistryFactory = await ethers.getContractFactory('AppWhitelistRegistry');
  const appWhitelistRegistryContract = await upgrades.deployProxy(
    AppWhitelistRegistryFactory,
    [
      /* wait for dataProtectorSharingContract deployment to know its address */
    ],
    {
      initializer: false,
      kind: 'transparent',
      constructorArgs: [POCO_APP_REGISTRY_ADDRESS],
    },
  );
  await appWhitelistRegistryContract.waitForDeployment();
  const appWhitelistRegistryAddress = await appWhitelistRegistryContract.getAddress();

  const DataProtectorSharingFactory = await ethers.getContractFactory('DataProtectorSharing');
  const dataProtectorSharingContract = await upgrades.deployProxy(
    DataProtectorSharingFactory,
    [deployer.address],
    {
      kind: 'transparent',
      constructorArgs: [
        POCO_PROXY_ADDRESS,
        POCO_APP_REGISTRY_ADDRESS,
        appWhitelistRegistryAddress,
      ],
    },
  );
  await dataProtectorSharingContract.waitForDeployment();
  // initialize appWhitelistRegistryContract
  await appWhitelistRegistryContract.initialize(await dataProtectorSharingContract.getAddress());

  const proxyAddress = await dataProtectorSharingContract.getAddress();
  // save the smart contract address in `.smart-contract-address` file for next usages
  await saveSmartContractAddress(proxyAddress);
  // save the constructor args params in `.constructor-args-params` file for next usages
  await saveConstructorArgsParams([
    POCO_PROXY_ADDRESS,
    POCO_APP_REGISTRY_ADDRESS,
    POCO_PROTECTED_DATA_REGISTRY_ADDRESS,
    appWhitelistRegistryAddress,
    deployer.address,
  ]);
  console.log(`Proxy AppWhitelistRegistry address: ${appWhitelistRegistryAddress}`);
  console.log(
    'Implementation address (AppWhitelistRegistry.sol):',
    await upgrades.erc1967.getImplementationAddress(appWhitelistRegistryAddress),
  );
  console.log(`Proxy DataProtectorSharing address: ${proxyAddress}`);
  console.log(
    'Implementation address (DataProtectorSharing.sol):',
    await upgrades.erc1967.getImplementationAddress(proxyAddress),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
