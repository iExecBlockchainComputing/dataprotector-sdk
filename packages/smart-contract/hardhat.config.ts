import '@nomicfoundation/hardhat-toolbox';
import { HardhatUserConfig } from 'hardhat/config';
import { env } from './config/env';

const privateKey = env.DEPLOYER_PRIVATE_KEY;

const config: HardhatUserConfig = {
    networks: {
        hardhat: {
            // fork needed to expose the CreateX factory used by the create2 deploy strategy
            forking: {
                enabled: true,
                url: 'https://sepolia-rollup.arbitrum.io/rpc',
            },
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
    //to verify contract on the block explorer
    etherscan: {
        apiKey: env.EXPLORER_API_KEY || '',
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
