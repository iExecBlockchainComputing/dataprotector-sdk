/* eslint-disable no-console */
import hre from 'hardhat';
import {
  DATASET_REGISTRY_ADDRESS as defaultDatasetRegistryAddress,
  POCO_ADDRESS as defaultPocoAddress,
  VOUCHER_HUB_ADDRESS as defaultVoucherHubAddress,
} from '../config/config.js';
import { getLoadFromEnv, impersonate, stopImpersonate } from './singleFunction/utils.js';

const { ethers, upgrades } = hre;

async function main() {
  const { ENV } = process.env;
  const loadFromEnv = getLoadFromEnv(ENV);

  const rpcUrl = hre.network.config.url;
  console.log('rpcUrl', rpcUrl);

  const provider = new ethers.JsonRpcProvider(rpcUrl);

  const {
    DATAPROTECTOR_SHARING_ADDRESS = loadFromEnv('dataprotectorSharingContractAddress'),
    ADD_ONLY_APP_WHITELIST_REGISTRY_ADDRESS = loadFromEnv('addOnlyAppWhitelistRegistryContractAddress'),
    POCO_ADDRESS = defaultPocoAddress,
    DATASET_REGISTRY_ADDRESS = defaultDatasetRegistryAddress,
    VOUCHER_HUB_ADDRESS = defaultVoucherHubAddress,
  } = process.env;

  const adminAddress = await upgrades.erc1967.getAdminAddress(DATAPROTECTOR_SHARING_ADDRESS);
  console.log(`Proxy at ${DATAPROTECTOR_SHARING_ADDRESS} administered by ${adminAddress}`);

  const adminOwner = await new ethers.Contract(
    adminAddress,
    [
      {
        inputs: [],
        name: 'owner',
        outputs: [
          {
            internalType: 'address',
            name: '',
            type: 'address',
          },
        ],
        stateMutability: 'view',
        type: 'function',
      },
    ],
    provider,
  ).owner();

  console.log(`admin contract owned by ${adminOwner}`);

  console.log('Starting upgrade with admin owner impersonation...');

  const upgradeDeployer = new ethers.JsonRpcSigner(provider, adminOwner);
  await impersonate({ rpcUrl, address: adminOwner });

  console.log('Deploying contracts with the account:', adminOwner);
  console.log(`Upgrading proxy at address: ${DATAPROTECTOR_SHARING_ADDRESS}`);

  const dataProtectorSharingConstructorArgs = [
    POCO_ADDRESS,
    DATASET_REGISTRY_ADDRESS,
    ADD_ONLY_APP_WHITELIST_REGISTRY_ADDRESS,
    VOUCHER_HUB_ADDRESS,
  ];

  const DataProtectorSharingFactoryV2 = (await ethers.getContractFactory('DataProtectorSharing')).connect(
    upgradeDeployer,
  );

  const proxyUpgrade = await upgrades.upgradeProxy(DATAPROTECTOR_SHARING_ADDRESS, DataProtectorSharingFactoryV2, {
    kind: 'transparent',
    constructorArgs: dataProtectorSharingConstructorArgs,
    txOverrides: { gasPrice: 0 },
  });

  const upgradeTx = proxyUpgrade.deployTransaction;

  console.log(`Upgrade tx ${upgradeTx.hash}`);
  // wait for upgrade
  await upgradeTx.wait();

  await stopImpersonate({ rpcUrl, address: adminAddress });

  const implementationAddress = await upgrades.erc1967.getImplementationAddress(DATAPROTECTOR_SHARING_ADDRESS);
  console.log('New implementation address (DataProtectorSharing.sol):', implementationAddress);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
