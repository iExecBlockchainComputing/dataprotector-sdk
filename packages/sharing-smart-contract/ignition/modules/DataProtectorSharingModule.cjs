/* eslint-disable import/extensions */
const { buildModule } = require('@nomicfoundation/hardhat-ignition/modules');

const {
    DATASET_REGISTRY_ADDRESS: defaultDatasetRegistryAddress,
    POCO_ADDRESS: defaultPocoAddress,
} = require('../../config/config.cjs');
const env = require('../../config/env.cjs');

// Hardhat Ignition does not support ESM yet.

// @ts-ignore
module.exports = buildModule('DataProtectorSharingModule', (m) => {
    // Use admin account if provided (index 1), otherwise fall back to deployer account (index 0)
    const proxyAdminOwner = env.ADMIN_PRIVATE_KEY ? m.getAccount(1) : m.getAccount(0);
    console.log(
        `Using proxy admin owner: ${proxyAdminOwner} (index: ${env.ADMIN_PRIVATE_KEY ? 1 : 0})`,
    );
    
    // Determine the admin address for initialization
    // Priority: ADMIN_ADDRESS env var > admin account from private key > deployer account
    let adminAddress;
    if (env.ADMIN_ADDRESS) {
        adminAddress = env.ADMIN_ADDRESS;
        console.log(`Using admin address from env: ${adminAddress}`);
    } else {
        adminAddress = proxyAdminOwner;
        console.log(`Using admin address from account: ${adminAddress}`);
    }
    
    const pocoAddress = env.POCO_ADDRESS || defaultPocoAddress;
    const datasetRegistryAddress = env.DATASET_REGISTRY_ADDRESS || defaultDatasetRegistryAddress;

    // Whitelist
    const addOnlyAppWhitelistRegistryImpl = m.contract('AddOnlyAppWhitelistRegistry', [], {
        id: 'AddOnlyAppWhitelistRegistryImpl',
    });
    const addOnlyAppWhitelistRegistryProxy = m.contract(
        'TransparentUpgradeableProxy',
        [
            addOnlyAppWhitelistRegistryImpl,
            proxyAdminOwner,
            m.encodeFunctionCall(addOnlyAppWhitelistRegistryImpl, 'initialize', []),
        ],
        {
            id: 'AddOnlyAppWhitelistRegistryProxy',
        },
    );
    const addOnlyAppWhitelistRegistry = m.contractAt(
        'AddOnlyAppWhitelistRegistry',
        addOnlyAppWhitelistRegistryProxy,
    );

    // DPS
    const dataProtectorSharingImpl = m.contract(
        'DataProtectorSharing',
        [pocoAddress, datasetRegistryAddress, addOnlyAppWhitelistRegistryProxy],
        {
            id: 'DataProtectorSharingImpl',
        },
    );
    const dataProtectorSharingProxy = m.contract(
        'TransparentUpgradeableProxy',
        [
            dataProtectorSharingImpl,
            proxyAdminOwner,
            m.encodeFunctionCall(dataProtectorSharingImpl, 'initialize', [adminAddress]),
        ],
        {
            id: 'DataProtectorSharingProxy',
        },
    );
    const dataProtectorSharing = m.contractAt('DataProtectorSharing', dataProtectorSharingProxy);

    return { addOnlyAppWhitelistRegistry, dataProtectorSharing };
});
