require('@nomicfoundation/hardhat-foundry');
require('@nomicfoundation/hardhat-toolbox');
require('@openzeppelin/hardhat-upgrades');
require('hardhat-contract-sizer');
require('dotenv').config();

const { WALLET_PRIVATE_KEY } = process.env;

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
  defaultNetwork: 'local-bellecour-fork',
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
    'ci-bellecour-fork': {
      ...bellecourBase,
      url: 'http://bellecour-fork:8545',
    },
    bellecour: {
      ...bellecourBase,
      url: 'https://bellecour.iex.ec',
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
  // gas reporter
  gasReporter: {
    enabled: true,
  },
  // to verify smart-contract on Blockscout
  etherscan: {
    apiKey: {
      bellecour: 'abc',
    },
    customChains: [
      {
        network: 'bellecour',
        chainId: 134,
        urls: {
          apiURL: 'https://blockscout-v6.bellecour.iex.ec/api',
          browserURL: 'https://blockscout-v6.bellecour.iex.ec',
        },
      },
    ],
  },
  sourcify: {
    enabled: false,
  },
  // contract sizer
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: true,
  },
  // typechain
  typechain: {
    outDir: 'typechain',
    target: 'ethers-v6',
    alwaysGenerateOverloads: false,
    dontOverrideCompile: false,
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
};
