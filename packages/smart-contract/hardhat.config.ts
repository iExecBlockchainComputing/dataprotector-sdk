import '@nomicfoundation/hardhat-toolbox';
import { HardhatUserConfig } from 'hardhat/config';
import { env } from './config/env';

const privateKey = env.WALLET_PRIVATE_KEY;

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
            bellecour: 'abc',
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
