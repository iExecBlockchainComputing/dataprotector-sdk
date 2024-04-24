export declare type KnownEnv = "prod" | "staging";
export declare type EnvKey =
  | "smsUrl"
  | "iexecGatewayUrl"
  | "resultProxyUrl"
  | "ipfsGatewayUrl"
  | "ipfsNodeUrl"
  /**
   * iExec prod Workerpool address
   */
  | "workerpoolProdAddress"
  /**
   * DataProtector contract address
   */
  | "dataprotectorContractAddress"
  /**
   * DataProtector indexing start bloc
   */
  | "dataprotectorStartBlock"
  /**
   * DataProtectorSharing contract address
   */
  | "dataprotectorSharingContractAddress"
  /**
   * DataProtectorSharing indexing start bloc
   */
  | "dataprotectorSharingStartBlock"
  /**
   * AddOnlyAppWhitelistRegistry contract address
   */
  | "addOnlyAppWhitelistRegistryContractAddress"
  /**
   * AddOnlyAppWhitelistRegistry indexing start bloc
   */
  | "addOnlyAppWhitelistRegistryStartBlock"
  | "protectedDataDeliveryWhitelistAddress"
  | "protectedDataDeliveryDappAddress"
  | "protectedDataDeliveryDappEns"
  | "dataprotectorSubgraphUrl";

export declare type Environment = Record<EnvKey, string | null>;

export declare const environments: Record<KnownEnv, Environment>;

export declare const getEnvironment: (env: KnownEnv) => Environment;
