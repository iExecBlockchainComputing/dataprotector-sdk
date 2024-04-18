// when editing this file update types/index.d.ts

export const KNOWN_ENVS = ["prod", "staging"];

export const KNOWN_KEYS = [
  // iexec protocol config
  "smsUrl",
  "iexecGatewayUrl",
  "resultProxyUrl",
  "ipfsGatewayUrl",
  "ipfsNodeUrl",
  "workerpoolProdAddress",
  // dataprotector config
  "DataProtectorContractAddress",
  "DataProtectorStartBlock",
  "DataProtectorSharingContractAddress",
  "DataProtectorSharingStartBlock",
  "AddOnlyAppWhitelistRegistryContractAddress",
  "AddOnlyAppWhitelistRegistryStartBlock",
  "protectedDataDeliveryDappAddress",
  "protectedDataDeliveryWhitelistAddress",
  "dataprotectorSubgraphUrl",
];
