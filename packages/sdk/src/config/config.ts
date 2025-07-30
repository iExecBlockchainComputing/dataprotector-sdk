export type ChainId = number;

export interface ChainConfig {
  name?: string;
  dataprotectorContractAddress?: string;
  sharingContractAddress?: string;
  subgraphUrl?: string;
  ipfsGateway?: string;
  ipfsNode?: string;
  smsDebugURL?: string;
  workerpoolAddress?: string;
  isExperimental?: boolean;
}

const CHAIN_CONFIG: Record<ChainId, ChainConfig> = {
  // Bellecour
  134: {
    name: 'bellecour',
    dataprotectorContractAddress: '0x3a4ab33f3d605e75b6d00a32a0fa55c3628f6a59',
    sharingContractAddress: '0x1390c3c6a545198809f1c7c5dd2600ef74d60925',
    subgraphUrl:
      'https://thegraph.iex.ec/subgraphs/name/bellecour/dataprotector-v2',
    ipfsGateway: 'https://ipfs-gateway.v8-bellecour.iex.ec',
    ipfsNode: 'https://ipfs-upload.v8-bellecour.iex.ec',
    smsDebugURL: 'https://sms-debug.iex.ec',
    workerpoolAddress: 'prod-v8-bellecour.main.pools.iexec.eth',
  },
  // Arbitrum Sepolia
  421614: {
    name: 'arbitrum-sepolia-testnet',
    dataprotectorContractAddress: '0x168eAF6C33a77E3caD9db892452f51a5D91df621',
    sharingContractAddress: '0x34AD9D161E815D7696777a9D2d668aF2d6e675e9',
    subgraphUrl:
      'https://thegraph.arbitrum-sepolia-testnet.iex.ec/api/subgraphs/id/5YjRPLtjS6GH6bB4yY55Qg4HzwtRGQ8TaHtGf9UBWWd',
    ipfsGateway: 'https://ipfs-gateway.arbitrum-sepolia-testnet.iex.ec',
    ipfsNode: 'https://ipfs-upload.arbitrum-sepolia-testnet.iex.ec',
    smsDebugURL: 'https://sms.arbitrum-sepolia-testnet.iex.ec', // ⚠️ default SMS is a debug SMS
    workerpoolAddress: '0xB967057a21dc6A66A29721d96b8Aa7454B7c383F',
    isExperimental: true,
  },
  // Arbitrum Mainnet
  42161: {
    name: 'arbitrum-mainnet',
    dataprotectorContractAddress: '0xF08f91F7646FDb95a4E24977b8Db91318252A667',
    sharingContractAddress: '0x2dA2D268281d79b81D609D68e4507e7ACDfd7E05',
    subgraphUrl:
      'https://thegraph.arbitrum.iex.ec/api/subgraphs/id/Ep5zs5zVr4tDiVuQJepUu51e5eWYJpka624X4DMBxe3u',
    ipfsGateway: 'https://ipfs-gateway.arbitrum-mainnet.iex.ec',
    ipfsNode: 'https://ipfs-upload.arbitrum-mainnet.iex.ec',
    smsDebugURL: 'https://sms-debug.arbitrum-mainnet.iex.ec',
    workerpoolAddress: '0x2C06263943180Cc024dAFfeEe15612DB6e5fD248',
  },
};

export const getChainConfig = (
  chainId: ChainId,
  options?: { allowExperimentalNetworks?: boolean }
): ChainConfig => {
  const config = CHAIN_CONFIG[chainId] || {};
  if (config?.isExperimental && !options?.allowExperimentalNetworks) {
    return {};
  }
  return config;
};

export const DEFAULT_CHAIN_ID = 134;
export const DEFAULT_ARWEAVE_UPLOAD_API = 'https://arweave-api.iex.ec';
export const DEFAULT_ARWEAVE_GATEWAY = 'https://arweave.net';
export const ARWEAVE_FREE_UPLOAD_MAX_SIZE = 100 * 1024; // 100kb
export const DEFAULT_DATA_NAME = '';
export const SCONE_TAG = ['tee', 'scone'];
export const DEFAULT_MAX_PRICE = 0;
export const MAX_DESIRED_DATA_ORDER_PRICE = 0;
export const MAX_DESIRED_APP_ORDER_PRICE = 0;
export const MAX_DESIRED_WORKERPOOL_ORDER_PRICE = 0;
export const KEY_PURPOSE_SELECTOR = 'keyHasPurpose(bytes32,uint256)';
export const GROUP_MEMBER_PURPOSE = 4;
