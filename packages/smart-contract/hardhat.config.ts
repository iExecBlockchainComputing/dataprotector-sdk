import '@nomicfoundation/hardhat-toolbox';
import { HardhatUserConfig } from 'hardhat/config';
import { env } from './config/env';
import { HARDHAT_NETWORK_MNEMONIC } from 'hardhat/internal/core/config/default-config';

const privateKey = env.WALLET_PRIVATE_KEY;

// Avalanche Fuji specific configuration
const fujiBaseConfig = {
    gasPrice: 25_000_000_000, // 25 Gwei default
    blockGasLimit: 8_000_000,
    chainId: 43113,
};

// Arbitrum Sepolia specific configuration
const arbitrumSepoliaBaseConfig = {
    gasPrice: 100_000_000, // 0.1 Gwei default (Arbitrum has lower gas prices)
    blockGasLimit: 30_000_000, // Arbitrum has higher block gas limits
    chainId: 421614,
};

const config: HardhatUserConfig = {
    networks: {
        hardhat: {
            forking: {
                enabled: true,
                url: 'https://bellecour.iex.ec',
            },
        },
        // modify with the dev network when the environment is ready
        bellecour: {
            url: 'https://bellecour.iex.ec',
            gasPrice: 0,
            accounts: privateKey ? [privateKey] : [],
        },
        // Add Fuji as a network
        avalancheFujiTestnet: {
            url: env.RPC_URL || 'https://api.avax-test.network/ext/bc/C/rpc',
            accounts: privateKey ? [privateKey] : [],
            ...fujiBaseConfig,
        },
        // Add Arbitrum Sepolia as a network
        'arbitrum-sepolia': {
            url: env.RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc',
            accounts: privateKey ? [privateKey] : [],
            ...arbitrumSepoliaBaseConfig,
        },
        // poco-chain native config
        'dev-native': {
            chainId: 65535,
            url: env.RPC_URL ?? 'http://localhost:8545',
            accounts: {
                mnemonic: env.MNEMONIC ?? '',
            },
            gasPrice: 0,
        },
    },
    //to verify contract on Blockscout
    etherscan: {
        apiKey: {
            bellecour: 'nothing', // a non-empty string is needed by the plugin.
            avalancheFujiTestnet: 'nothing', // a non-empty string is needed by the plugin.
            arbitrumSepolia: env.ARBISCAN_API_KEY,
        },
        customChains: [
            {
                network: 'bellecour',
                chainId: 134,
                urls: {
                    apiURL: 'https://blockscout.bellecour.iex.ec/api',
                    browserURL: 'https://blockscout.bellecour.iex.ec',
                },
            },
        ],
    },
    //compiler version
    solidity: {
        version: '0.8.29',
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    },
};
export default config;
