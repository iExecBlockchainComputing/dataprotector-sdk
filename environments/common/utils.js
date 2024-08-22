// when editing this file update types/index.d.ts

export const KNOWN_ENVS = ['prod', 'staging', 'bubble', 'bellecour-fork'];

export const KNOWN_KEYS = [
  // iexec protocol config
  'chainId',
  'rpcURL',
  'hubAddress',
  'ensRegistryAddress',
  'ensPublicResolverAddress',
  'voucherHubAddress',
  'smsUrl',
  'iexecGatewayURL',
  'resultProxyURL',
  'ipfsGatewayURL',
  'pocoSubgraphURL',
  'voucherSubgraphURL',

  'appRegistryAddress',
  'datasetRegistryAddress',
  'workerpoolRegistryAddress',

  // dataprotector config
  'dataprotectorContractAddress',
  'dataprotectorSharingContractAddress',
  'dataprotectorSubgraphUrl',
  'ipfsNode',
  'ipfsGateway',

  'dataprotectorStartBlock',
  'dataprotectorSharingStartBlock',
  'addOnlyAppWhitelistRegistryContractAddress',
  'addOnlyAppWhitelistRegistryStartBlock',
  // protected data delivery dapp
  'protectedDataDeliveryWhitelistAddress',
  'protectedDataDeliveryDappAddress',
  'protectedDataDeliveryDappEns',

  'workerpoolProdAddress',
];
