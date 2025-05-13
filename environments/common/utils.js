// when editing this file update types/index.d.ts

export const KNOWN_ENVS = ["prod", "staging"];

export const KNOWN_KEYS = [
  // iexec protocol config
  "smsUrl",
  "iexecGatewayUrl",
  "resultProxyUrl", // TODO remove
  "ipfsGatewayUrl",
  "ipfsNodeUrl",
  "workerpoolProdAddress",
  // dataprotector config
  "dataprotectorContractAddress",
  "dataprotectorStartBlock",
  "dataprotectorSharingContractAddress",
  "dataprotectorSharingStartBlock",
  "addOnlyAppWhitelistRegistryContractAddress",
  "addOnlyAppWhitelistRegistryStartBlock",
  "dataprotectorSubgraphUrl",
  // protected data delivery dapp
  "protectedDataDeliveryWhitelistAddress",
  "protectedDataDeliveryDappAddress",
  "protectedDataDeliveryDappEns",
];
