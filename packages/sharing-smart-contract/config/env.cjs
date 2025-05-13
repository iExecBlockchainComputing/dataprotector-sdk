// Hardhat Ignition does not support ESM modules, so we use CommonJS syntax.
// TODO refactor this to use ESM syntax when Hardhat Ignition supports it.

require('dotenv/config.js');
const { z } = require('zod');

const addressRegex = /(^|\b)(0x)?[0-9a-fA-F]{64}(\b|$)/;
const privateKeyRegex = /(^|\b)(0x)?[0-9a-fA-F]{64}(\b|$)/;

const envSchema = z.object({
    // Private key of the wallet used for transactions
    WALLET_PRIVATE_KEY: z
        .string()
        .regex(privateKeyRegex, 'Invalid private key format')
        .optional()
        .or(z.literal('')),

    // environment to use for configuration (prod/staging)
    ENV: z.enum(['prod', 'staging'], 'ENV must be either "prod" or "staging"').default('prod'),

    // Address of the PoCo contract
    POCO_ADDRESS: z
        .string()
        .regex(addressRegex, 'Invalid Ethereum address format')
        .optional()
        .or(z.literal('')),

    // Address of the DatasetRegistry
    DATASET_REGISTRY_ADDRESS: z
        .string()
        .regex(addressRegex, 'Invalid Ethereum address format')
        .optional()
        .or(z.literal('')),

    // URL of the RPC used for network connection
    RPC_URL: z.string().url('RPC_URL must be a valid URL').optional().or(z.literal('')),

    // Mnemonic for deployment or network interaction
    MNEMONIC: z.string().min(1, 'MNEMONIC cannot be empty').optional().or(z.literal('')),
});

module.exports = {
    env: envSchema.parse(process.env),
};
