/* eslint-disable no-console */
import { getEnvironment } from '@iexec/dataprotector-environments';
import hre from 'hardhat';
import { DATASET_REGISTRY_ADDRESS, POCO_ADDRESS } from '../config/config.js';
import { VOUCHER_HUB_ADDRESS } from '../test/bellecour-fork/voucher-config.js';
import { impersonate, stopImpersonate } from './singleFunction/utils.js';

const { ethers, upgrades } = hre;

async function main() {
  const { ENV } = process.env;
  console.log(`using ENV: ${ENV}`);

  const rpcUrl = hre.network.config.url;
  console.log('rpcUrl', rpcUrl);

  const provider = new ethers.JsonRpcProvider(rpcUrl);

  const { dataprotectorSharingContractAddress, addOnlyAppWhitelistRegistryContractAddress } = getEnvironment(ENV);

  const adminAddress = await upgrades.erc1967.getAdminAddress(dataprotectorSharingContractAddress);
  console.log(`Proxy at ${dataprotectorSharingContractAddress} administered by ${adminAddress}`);

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
  console.log(`Upgrading proxy at address: ${dataprotectorSharingContractAddress}`);

  const dataProtectorSharingConstructorArgs = [
    POCO_ADDRESS,
    DATASET_REGISTRY_ADDRESS,
    addOnlyAppWhitelistRegistryContractAddress,
    VOUCHER_HUB_ADDRESS,
  ];

  const DataProtectorSharingFactoryV2 = (await ethers.getContractFactory('DataProtectorSharing')).connect(
    upgradeDeployer,
  );

  const proxyUpgrade = await upgrades.upgradeProxy(dataprotectorSharingContractAddress, DataProtectorSharingFactoryV2, {
    kind: 'transparent',
    constructorArgs: dataProtectorSharingConstructorArgs,
    txOverrides: { gasPrice: 0 },
  });

  const upgradeTx = proxyUpgrade.deployTransaction;

  console.log(`Upgrade tx ${upgradeTx.hash}`);
  // wait for upgrade
  await upgradeTx.wait();

  await stopImpersonate({ rpcUrl, address: adminAddress });

  const implementationAddress = await upgrades.erc1967.getImplementationAddress(dataprotectorSharingContractAddress);
  console.log('New implementation address (DataProtectorSharing.sol):', implementationAddress);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
