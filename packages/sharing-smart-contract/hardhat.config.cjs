require('@nomicfoundation/hardhat-foundry');
require('@nomicfoundation/hardhat-toolbox');
require('@openzeppelin/hardhat-upgrades');
require('hardhat-contract-sizer');
require('@openzeppelin/hardhat-upgrades');
require('hardhat-dependency-compiler');
const env = require('./config/env.cjs');

// TODO format

const bellecourBase = {
  gasPrice: 0,
  blockGasLimit: 6_700_000,
  hardfork: 'berlin',
};

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  // run `npx hardhat node` to start the forked bellecour node "local-bellecour-fork"
  networks: {
    hardhat: {
      ...bellecourBase,
      chainId: 134,
      forking: {
        enabled: true,
        url: 'https://bellecour.iex.ec',
      },
    },
    'local-bellecour-fork': {
      ...bellecourBase,
      url: 'http://127.0.0.1:8545',
    },
    bellecour: {
      ...bellecourBase,
      url: 'https://bellecour.iex.ec',
      accounts: env.PRIVATE_KEY ? [env.PRIVATE_KEY] : [],
    },
    avalancheFujiTestnet: {
      chainId: 43113,
      url: env.FUJI_RPC_URL || 'https://api.avax-test.network/ext/bc/C/rpc',
      accounts: [
        env.PRIVATE_KEY ||
          '0x0000000000000000000000000000000000000000000000000000000000000000',
      ],
      blockGasLimit: 8_000_000,
    },
    arbitrumSepolia: {
      chainId: 421614,
      url: env.ARBITRUM_SEPOLIA_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc',
      accounts: [
        process.env.PRIVATE_KEY ||
          '0x0000000000000000000000000000000000000000000000000000000000000000',
      ],
      blockGasLimit: 30_000_000,
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
  // gas reporter
  gasReporter: {
    enabled: true,
  },
  // to verify smart-contract on Blockscout
  etherscan: {
    apiKey: {
      bellecour: 'nothing', // a non-empty string is needed by the plugin.
      avalancheFujiTestnet: 'nothing', // a non-empty string is needed by the plugin.
      arbitrumSepolia: process.env.ETHERSCAN_API_KEY || '',
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
  sourcify: {
    enabled: true,
  },
  // contract sizer
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: true,
  },
  // compiler version
  solidity: {
    version: '0.8.24',
    settings: {
      evmVersion: 'paris',
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  ignition: {
    strategyConfig: {
      create2: {
        salt: "0x5FD8F2C3DFCF36E174AC91A44AE6CAEBDDA012EFED601736E2C20A11A56CF539",
      },
    },
  },
  dependencyCompiler: {
    paths: [
      '@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol',
    ],
  },
};
