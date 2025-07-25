import hre from 'hardhat';
import env from '../config/env.js';
import DataProtectorSharingModule from '../ignition/modules/DataProtectorSharingModule.cjs';

const { ethers, upgrades } = hre;

// Get deployment ID from environment variable
const deploymentId = env.DEPLOYMENT_ID;

/**
 * This script deploys DataProtectorSharing contract and its dependencies using
 * Hardhat Ignition and createX factory if supported.
 * It also imports the deployed contracts into the OpenZeppelin upgrades plugin.
 */

async function main() {
    const pocoAddress = env.POCO_ADDRESS;
    const datasetRegistryAddress = env.DATASET_REGISTRY_ADDRESS;
    if (!pocoAddress || !datasetRegistryAddress) {
        throw new Error('POCO_ADDRESS and DATASET_REGISTRY_ADDRESS are required.');
    }
    const [deployer] = await ethers.getSigners();
    console.log(`Deploying DataProtectorSharingModule [Deployer:${deployer.address}]`);
    console.log('PoCo address:', pocoAddress);
    console.log('DatasetRegistry address:', datasetRegistryAddress);
    // Check if the CreateX factory is supported on the current network.
    const isCreatexSupported = await isCreatexFactorySupported();
    if (isCreatexSupported) {
        console.log('CreateX factory is supported.');
    } else {
        console.log('⚠️  CreateX factory is NOT supported.');
    }
    // Deploy contracts using Ignition module.
    let deploymentResult;
    try {
        console.log(`Attempting deployment${isCreatexSupported ? ' with CREATE2 strategy' : ''}...`);
        deploymentResult = await hre.ignition.deploy(
            DataProtectorSharingModule,
            {
                ...(isCreatexSupported && {
                    strategy: 'create2',
                    strategyConfig: hre.userConfig.ignition.strategyConfig.create2,
                }),
                displayUi: true, // for logs.
                ...(deploymentId && { deploymentId }),
            },
        );
        console.log(`✅ Deployment successful${isCreatexSupported ? ' with CREATE2' : ''}!`);
    } catch (error) {
        if (isCreatexSupported && (error.message.includes('FailedContractCreation') || error.message.includes('CREATE2'))) {
            console.log('⚠️  CREATE2 deployment failed, falling back to normal deployment...');
            console.log(`Error details: ${error.message}`);
            deploymentResult = await hre.ignition.deploy(
                DataProtectorSharingModule,
                {
                    displayUi: true, // for logs.
                    ...(deploymentId && { deploymentId }),
                },
            );
            console.log('✅ Fallback deployment successful!');
        } else {
            throw error;
        }
    }
    const { addOnlyAppWhitelistRegistry, dataProtectorSharing } = deploymentResult;
    // Import proxies in OZ `upgrades` plugin for future upgrades.
    console.log(`Importing proxy contracts in OZ upgrades...`);
    const whitelistProxyAddress = await addOnlyAppWhitelistRegistry.getAddress();
    await upgrades.forceImport(
        whitelistProxyAddress,
        await ethers.getContractFactory('AddOnlyAppWhitelistRegistry'),
        {
            kind: 'transparent',
        },
    );
    await upgrades.forceImport(
        await dataProtectorSharing.getAddress(),
        await ethers.getContractFactory('DataProtectorSharing'),
        {
            kind: 'transparent',
            constructorArgs: [pocoAddress, datasetRegistryAddress, whitelistProxyAddress],
        },
    );
}

async function isCreatexFactorySupported() {
    const code = await ethers.provider.getCode('0xba5Ed099633D3B313e4D5F7bdc1305d3c28ba5Ed');
    return code !== '0x';
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
