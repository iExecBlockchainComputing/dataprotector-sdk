import { getEnvironment } from '@iexec/dataprotector-environments';
import { readFileSync, writeFileSync } from 'fs';

const { ENV = 'staging' } = process.env;

console.log(`generating .env for ${ENV} (set ENV to override)`);

const {
  iexecGatewayUrl,
  smsUrl,
  resultProxyUrl,
  ipfsGatewayUrl,
  ipfsNodeUrl,
  workerpoolProdAddress,
  dataprotectorContractAddress,
  dataprotectorSharingContractAddress,
  dataprotectorSubgraphUrl,
  protectedDataDeliveryDappAddress,
  protectedDataDeliveryWhitelistAddress,
} = getEnvironment(ENV);

const envTemplate = readFileSync('.env.example').toString();
writeFileSync(
  '.env',
  `${envTemplate}

#### ${ENV} environment ####
VITE_IEXEC_GATEWAY_URL=${iexecGatewayUrl}
VITE_SMS_URL=${smsUrl}
VITE_RESULT_PROXY_URL=${resultProxyUrl}
VITE_IPFS_GATEWAY_URL=${ipfsGatewayUrl}
# VITE_IPFS_NODE_URL=${ipfsNodeUrl}
VITE_IPFS_NODE_URL=https://contentcreator-upload.iex.ec
VITE_WORKERPOOL_ADDRESS=${workerpoolProdAddress}
VITE_DATAPROTECTOR_ADDRESS=${dataprotectorContractAddress}
VITE_DATAPROTECTOR_SUBGRAPH_URL=${dataprotectorSubgraphUrl}
VITE_DATAPROTECTOR_SHARING_ADDRESS=${dataprotectorSharingContractAddress}
VITE_PROTECTED_DATA_DELIVERY_WHITELIST_ADDRESS=${protectedDataDeliveryWhitelistAddress}
VITE_PROTECTED_DATA_DELIVERY_DAPP_ADDRESS=${protectedDataDeliveryDappAddress}
`
);
