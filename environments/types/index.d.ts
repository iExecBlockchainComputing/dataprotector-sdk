export declare type KnownEnv = 'prod' | 'staging' | 'bubble' | 'bellecour-fork';
export declare type EnvKey =
  /**
   * IExecConfigOptions
   */
  | 'chainId'
  | 'rpcURL'
  | 'hubAddress'
  | 'ensRegistryAddress'
  | 'ensPublicResolverAddress'
  | 'voucherHubAddress'
  | 'resultProxyURL'
  | 'smsURL'
  | 'ipfsGatewayURL'
  | 'iexecGatewayURL'
  | 'pocoSubgraphURL'
  | 'voucherSubgraphURL'
  | 'appRegistryAddress'
  | 'datasetRegistryAddress'
  | 'workerpoolRegistryAddress'
  /**
   * DataProtectorConfigOptions
   */
  | 'dataprotectorContractAddress'
  | 'dataprotectorSharingContractAddress'
  | 'dataprotectorSubgraphUrl'
  | 'ipfsNode'
  | 'ipfsGateway'
  /**
   * iExec prod Workerpool address
   */
  | 'workerpoolProdAddress'
  /**
   * DataProtector indexing start bloc
   */
  | 'dataprotectorStartBlock'
  /**
   * DataProtectorSharing indexing start bloc
   */
  | 'dataprotectorSharingStartBlock'
  /**
   * AddOnlyAppWhitelistRegistry contract address
   */
  | 'addOnlyAppWhitelistRegistryContractAddress'
  /**
   * AddOnlyAppWhitelistRegistry indexing start bloc
   */
  | 'addOnlyAppWhitelistRegistryStartBlock'
  | 'protectedDataDeliveryWhitelistAddress'
  | 'protectedDataDeliveryDappAddress'
  | 'protectedDataDeliveryDappEns';

export declare type Environment = Record<EnvKey, string | null>;

export declare const environments: Record<KnownEnv, Environment>;

export declare const getEnvironment: (env: KnownEnv) => Environment;
