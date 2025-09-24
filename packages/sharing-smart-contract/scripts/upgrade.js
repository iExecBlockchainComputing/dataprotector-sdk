import hre from 'hardhat';
import { DATASET_REGISTRY_ADDRESS, POCO_ADDRESS } from '../config/config.js';
import env from '../config/env.js';

const { ethers, upgrades } = hre;

// This script is under construction.
// TODO implement the upgrade logic and remove the throw below.
// Questions:
// - How to get DATA_PROTECTOR_SHARING_ADDRESS and ADD_ONLY_APP_WHITELIST_REGISTRY_ADDRESS?

function throwAndExitTemporarily() {
    throw new Error('Not implemented yet.');
}

async function main() {
    // ⚠️
    throwAndExitTemporarily();

    const dataprotectorSharingContractAddress = env.DATA_PROTECTOR_SHARING_ADDRESS;
    const addOnlyAppWhitelistRegistryContractAddress = env.ADD_ONLY_APP_WHITELIST_REGISTRY_ADDRESS;

    console.log(`Using poco at ${POCO_ADDRESS}`);
    console.log(`Using dataset registry at ${DATASET_REGISTRY_ADDRESS}`);

    console.log('Starting upgrade...');
    const [deployer] = await ethers.getSigners();

    console.log('Deploying contracts with the account:', deployer.address);
    console.log(`Upgrading proxy at address: ${dataprotectorSharingContractAddress}`);

    const dataProtectorSharingConstructorArgs = [
        POCO_ADDRESS,
        DATASET_REGISTRY_ADDRESS,
        addOnlyAppWhitelistRegistryContractAddress,
    ];

    // pass the registry instance to the deploy method
    const DataProtectorSharingFactoryV2 = await ethers.getContractFactory('DataProtectorSharing');
    const proxyUpgrade = await upgrades.upgradeProxy(
        dataprotectorSharingContractAddress,
        DataProtectorSharingFactoryV2,
        {
            kind: 'transparent',
            constructorArgs: dataProtectorSharingConstructorArgs,
        },
    );

    const upgradeTx = proxyUpgrade.deployTransaction;
    console.log(`Upgrade tx ${upgradeTx.hash}`);
    // wait for upgrade
    await upgradeTx.wait();

    const implementationAddress = await upgrades.erc1967.getImplementationAddress(
        dataprotectorSharingContractAddress,
    );
    console.log('New implementation address (DataProtectorSharing.sol):', implementationAddress);

    // Verify smart-contract
    try {
        await hre.run('verify:verify', {
            address: implementationAddress,
            constructorArguments: dataProtectorSharingConstructorArgs,
        });
    } catch (e) {
        console.log(
            'New implementation verification for DataProtectorSharing may have failed :',
            e,
        );
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
