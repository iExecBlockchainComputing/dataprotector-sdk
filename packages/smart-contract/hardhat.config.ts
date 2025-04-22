import '@nomicfoundation/hardhat-toolbox';
import { HardhatUserConfig } from 'hardhat/config';
import { env } from './config/env';

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
        avalancheFuji: {
            url: env.RPC_URL || 'https://api.avax-test.network/ext/bc/C/rpc',
            accounts: privateKey ? [privateKey] : [],
            ...fujiBaseConfig,
        },
        // Add Arbitrum Sepolia as a network
        arbitrumSepolia: {
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
            avalancheFuji: 'nothing', // a non-empty string is needed by the plugin.
            arbitrumSepolia: env.ARBISCAN_API_KEY || '',
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
    // Create2 deployments
    ignition: {
        strategyConfig: {
            create2: {
                salt: '0x0000000000000000000000000000000000000000000000000000000000000000',
            },
        },
    },
    //compiler version
    solidity: {
        version: '0.8.19',
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    },
};
export default config;
