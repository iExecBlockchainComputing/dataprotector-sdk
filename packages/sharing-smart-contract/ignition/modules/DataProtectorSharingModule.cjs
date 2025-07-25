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
    // Use admin private key if provided, otherwise fall back to the first account
    const proxyAdminOwner = env.ADMIN_PRIVATE_KEY 
        ? m.getAccount(env.ADMIN_PRIVATE_KEY) 
        : m.getAccount(0);
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
            '0x', // No initialization data.
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
            '0x', // No initialization data.
        ],
        {
            id: 'DataProtectorSharingProxy',
        },
    );
    const dataProtectorSharing = m.contractAt('DataProtectorSharing', dataProtectorSharingProxy);

    return { addOnlyAppWhitelistRegistry, dataProtectorSharing };
});
