export type ChainId = number;

export interface ChainConfig {
  name?: string;
  dataprotectorContractAddress?: string;
  subgraphUrl?: string;
  ipfsGateway?: string;
  ipfsNode?: string;
  workerpoolAddress?: string;
  isExperimental?: boolean;
}

const CHAIN_CONFIG: Record<ChainId, ChainConfig> = {
  // Arbitrum Sepolia
  421614: {
    name: 'arbitrum-sepolia-testnet',
    dataprotectorContractAddress: '0x168eaf6c33a77e3cad9db892452f51a5d91df621',
    subgraphUrl:
      'https://thegraph.arbitrum-sepolia-testnet.iex.ec/api/subgraphs/id/5YjRPLtjS6GH6bB4yY55Qg4HzwtRGQ8TaHtGf9UBWWd',
    ipfsGateway: 'https://ipfs-gateway.arbitrum-sepolia-testnet.iex.ec',
    ipfsNode: 'https://ipfs-upload.arbitrum-sepolia-testnet.iex.ec',
    workerpoolAddress: '0xB967057a21dc6A66A29721d96b8Aa7454B7c383F',
  },
  // Arbitrum Mainnet
  42161: {
    name: 'arbitrum-mainnet',
    dataprotectorContractAddress: '0xF08f91F7646FDb95a4E24977b8Db91318252A667',
    subgraphUrl:
      'https://thegraph.arbitrum.iex.ec/api/subgraphs/id/Ep5zs5zVr4tDiVuQJepUu51e5eWYJpka624X4DMBxe3u',
    ipfsGateway: 'https://ipfs-gateway.arbitrum-mainnet.iex.ec',
    ipfsNode: 'https://ipfs-upload.arbitrum-mainnet.iex.ec',
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

export const DEFAULT_ARWEAVE_UPLOAD_API = 'https://arweave-api.iex.ec';
export const DEFAULT_ARWEAVE_GATEWAY = 'https://arweave.net';
export const ARWEAVE_FREE_UPLOAD_MAX_SIZE = 100 * 1024; // 100kb
export const DEFAULT_DATA_NAME = '';
export const TEE_TAG = ['tee'];
export const DEFAULT_MAX_PRICE = 0;
export const MAX_DESIRED_DATA_ORDER_PRICE = 0;
export const MAX_DESIRED_APP_ORDER_PRICE = 0;
export const MAX_DESIRED_WORKERPOOL_ORDER_PRICE = 0;
export const KEY_PURPOSE_SELECTOR = 'keyHasPurpose(bytes32,uint256)';
export const GROUP_MEMBER_PURPOSE = 4;
