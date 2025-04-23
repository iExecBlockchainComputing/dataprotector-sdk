/* eslint-disable no-console */
import { getEnvironment } from '@iexec/dataprotector-environments';
import hre from 'hardhat';
import { DATASET_REGISTRY_ADDRESS, POCO_ADDRESS } from '../config/config.js';

const { ethers, upgrades } = hre;

async function main() {
    const { ENV } = process.env;
    console.log(`Using ENV: ${ENV}`);

    const { dataprotectorSharingContractAddress, addOnlyAppWhitelistRegistryContractAddress } =
        getEnvironment(ENV);

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
