import '@nomicfoundation/hardhat-toolbox';
import { HardhatUserConfig } from 'hardhat/config';
import { env } from './config/env';

const privateKey = env.DEPLOYER_PRIVATE_KEY;

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
            blockGasLimit: 8_000_000,
            chainId: 43113,
        },
        // Add Arbitrum Sepolia as a network
        arbitrumSepolia: {
            url: env.RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc',
            accounts: privateKey ? [privateKey] : [],
            blockGasLimit: 30_000_000, // Arbitrum has higher block gas limits
            chainId: 421614,
        },
        arbitrum: {
            url: env.RPC_URL || 'https://arb1.arbitrum.io/rpc',
            accounts: privateKey ? [privateKey] : [],
            blockGasLimit: 30_000_000, // Arbitrum has higher block gas limits
            chainId: 42161,
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
        apiKey: env.IS_VERIFICATION_API_V2
            ? env.EXPLORER_API_KEY
            : {
                  bellecour: env.EXPLORER_API_KEY || 'nothing', // a non-empty string is needed by the plugin.
                  avalancheFuji: env.EXPLORER_API_KEY || 'nothing', // a non-empty string is needed by the plugin.
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
            {
                network: 'avalancheFuji',
                chainId: 43113,
                urls: {
                    // Snowtrace explorer.
                    apiURL: 'https://api.routescan.io/v2/network/testnet/evm/43113/etherscan/api',
                    browserURL: 'https://testnet.snowtrace.io/',
                },
            },
        ],
    },
    sourcify: {
        enabled: true,
    },
    // Create2 deployments: it use crateX factory to deploy the contract
    //TODO: Handle salt dynamically depending on the network and the dev/prod environment
    ignition: {
        strategyConfig: {
            create2: {
                // salt: '0x15687ade6b13dd23b6410e059fce02263e68e1af5ee0cf426798f4616f74f8aa',
                salt: '0x0000000000000000000000000000000000000000000000000000000000000000',
            },
        },
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
