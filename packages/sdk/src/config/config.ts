import { getEnvironment, KnownEnv } from '@iexec/dataprotector-environments';
import 'dotenv/config';

const { ENV = 'bellecour-fork' } = process.env;

const {
  ipfsGateway,
  ipfsNode,
  dataprotectorContractAddress,
  dataprotectorSharingContractAddress,
  dataprotectorSubgraphUrl,
  workerpoolProdAddress,
  appRegistryAddress,
  datasetRegistryAddress,
} = getEnvironment(ENV as KnownEnv);

export const DEFAULT_IPFS_GATEWAY = ipfsGateway;

export const DEFAULT_IEXEC_IPFS_NODE = ipfsNode;

export const DEFAULT_DATA_NAME = '';

// Original DataProtector smart-contract
export const DEFAULT_CONTRACT_ADDRESS =
  dataprotectorContractAddress.toLowerCase();

// iExec POCO Dataset Registry
export const POCO_DATASET_REGISTRY_CONTRACT_ADDRESS =
  datasetRegistryAddress.toLowerCase();

// iExec POCO App Registry
export const POCO_APP_REGISTRY_CONTRACT_ADDRESS =
  appRegistryAddress.toLowerCase();

export const DEFAULT_SHARING_CONTRACT_ADDRESS =
  dataprotectorSharingContractAddress.toLowerCase();
export const DEFAULT_SUBGRAPH_URL = dataprotectorSubgraphUrl;

export const WORKERPOOL_ADDRESS = workerpoolProdAddress;

export const SCONE_TAG = ['tee', 'scone'];

export const DEFAULT_MAX_PRICE = 0;

export const KEY_PURPOSE_SELECTOR = 'keyHasPurpose(bytes32,uint256)';

export const GROUP_MEMBER_PURPOSE = 4;
