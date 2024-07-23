import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import '@nomiclabs/hardhat-etherscan';

const { WALLET_PRIVATE_KEY } = process.env;

const config: HardhatUserConfig = {
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {},
    // modify with the dev network when the environment is ready
    bellecour: {
      url: 'https://bellecour.iex.ec',
      gasPrice: 0,
      accounts: WALLET_PRIVATE_KEY ? [WALLET_PRIVATE_KEY] : [],
    },
    // poco-chain native config
    'dev-native': {
      chainId: 65535,
      url: process.env.RPC_URL ?? 'http://localhost:8545',
      accounts: {
        mnemonic: process.env.MNEMONIC ?? '',
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
          apiURL: 'https://blockscout-bellecour.iex.ec/api',
          browserURL: 'https://blockscout-bellecour.iex.ec',
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
