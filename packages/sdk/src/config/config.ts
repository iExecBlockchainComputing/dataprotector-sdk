export type ChainId = number;

export interface ChainConfig {
  name: string;
  dataprotectorContractAddress: string;
  sharingContractAddress: string;
  subgraphUrl: string;
  ipfsGateway: string;
  ipfsNode: string;
  smsDebugURL: string;
  workerpoolAddress: string;
}

export const CHAIN_CONFIG: Record<ChainId, ChainConfig> = {
  // Bellecour
  134: {
    name: 'bellecour',
    dataprotectorContractAddress: '0x3a4ab33f3d605e75b6d00a32a0fa55c3628f6a59',
    sharingContractAddress: '0x1390c3c6a545198809f1c7c5dd2600ef74d60925',
    subgraphUrl: 'https://thegraph.iex.ec/subgraphs/name/bellecour/dataprotector-v2',
    ipfsGateway: 'https://ipfs-gateway.v8-bellecour.iex.ec',
    ipfsNode: 'https://ipfs-upload.v8-bellecour.iex.ec',
    smsDebugURL: 'https://sms-debug.iex.ec',
    workerpoolAddress:'prod-v8-bellecour.main.pools.iexec.eth'
  },

  // Arbitrum
  42161: {
    name: 'arbitrum',
    dataprotectorContractAddress: '0xYourArbitrumContractAddress',
    sharingContractAddress: '0xYourArbitrumSharingAddress',
    subgraphUrl: 'https://api.thegraph.com/subgraphs/name/your/arbitrum-subgraph',
    ipfsGateway: 'https://your-arbitrum-ipfs-gateway',
    ipfsNode: 'https://your-arbitrum-ipfs-node',
    smsDebugURL: 'https://your-arbitrum-sms-url',
    workerpoolAddress:'WorkerpoolAddress'
  },

  // Avalanche 
  43114: {
    name: 'avalanche',
    dataprotectorContractAddress: '0xYourAvalancheContractAddress',
    sharingContractAddress: '0xYourAvalancheSharingAddress',
    subgraphUrl: 'https://api.thegraph.com/subgraphs/name/your/avalanche-subgraph',
    ipfsGateway: 'https://your-avalanche-ipfs-gateway',
    ipfsNode: 'https://your-avalanche-ipfs-node',
    smsDebugURL: 'https://your-avalanche-sms-url',
    workerpoolAddress:'WorkerpoolAddress'
  },
};

export const DEFAULT_CHAIN_ID = 134;
export const DEFAULT_DATA_NAME = '';
export const SCONE_TAG = ['tee', 'scone'];
export const DEFAULT_MAX_PRICE = 0;
export const MAX_DESIRED_DATA_ORDER_PRICE = 0;
export const MAX_DESIRED_APP_ORDER_PRICE = 0;
export const MAX_DESIRED_WORKERPOOL_ORDER_PRICE = 0;
export const KEY_PURPOSE_SELECTOR = 'keyHasPurpose(bytes32,uint256)';
export const GROUP_MEMBER_PURPOSE = 4;
