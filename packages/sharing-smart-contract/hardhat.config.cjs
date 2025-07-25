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
      accounts: [
        env.DEPLOYER_PRIVATE_KEY ||
          '0x0000000000000000000000000000000000000000000000000000000000000000',
        env.ADMIN_PRIVATE_KEY ||
          env.DEPLOYER_PRIVATE_KEY ||
          '0x0000000000000000000000000000000000000000000000000000000000000000',
      ],
    },
    avalancheFujiTestnet: {
      chainId: 43113,
      url: env.RPC_URL || 'https://api.avax-test.network/ext/bc/C/rpc',
      accounts: [
        env.DEPLOYER_PRIVATE_KEY ||
          '0x0000000000000000000000000000000000000000000000000000000000000000',
        env.ADMIN_PRIVATE_KEY ||
          env.DEPLOYER_PRIVATE_KEY ||
          '0x0000000000000000000000000000000000000000000000000000000000000000',
      ],
      blockGasLimit: 8_000_000,
    },
    arbitrumSepolia: {
      chainId: 421614,
      url: env.RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc',
      accounts: [
        env.DEPLOYER_PRIVATE_KEY ||
          '0x0000000000000000000000000000000000000000000000000000000000000000',
        env.ADMIN_PRIVATE_KEY ||
          env.DEPLOYER_PRIVATE_KEY ||
          '0x0000000000000000000000000000000000000000000000000000000000000000',
      ],
      blockGasLimit: 30_000_000,
    },
    arbitrum: {
      chainId: 42161,
      url: env.RPC_URL || 'https://arb1.arbitrum.io/rpc',
      accounts: [
        env.DEPLOYER_PRIVATE_KEY ||
          '0x0000000000000000000000000000000000000000000000000000000000000000',
        env.ADMIN_PRIVATE_KEY ||
          env.DEPLOYER_PRIVATE_KEY ||
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
    apiKey: env.IS_VERIFICATION_API_V2
      ? env.EXPLORER_API_KEY
      : {
          bellecour: env.EXPLORER_API_KEY || 'nothing', // a non-empty string is needed by the plugin.
          avalancheFujiTestnet: env.EXPLORER_API_KEY || 'nothing', // a non-empty string is needed by the plugin.
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
        network: 'avalancheFujiTestnet',
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
        salt: "0x0000000000000000000000000000000000000001000000000000000000000001",
      },
    },
  },
  dependencyCompiler: {
    paths: [
      '@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol',
    ],
  },
};
