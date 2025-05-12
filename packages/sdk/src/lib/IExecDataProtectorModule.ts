import {
  AbstractProvider,
  AbstractSigner,
  Eip1193Provider,
} from 'ethers';
import { GraphQLClient } from 'graphql-request';
import { IExec } from 'iexec';
import {
  CHAIN_CONFIG,
} from '../config/config.js';
import { getChainIdFromProvider } from '../utils/getChainId.js';
import {
  AddressOrENS,
  DataProtectorConfigOptions,
  Web3SignerProvider,
} from './types/index.js';

type EthersCompatibleProvider =
  | AbstractProvider
  | AbstractSigner
  | Eip1193Provider
  | Web3SignerProvider
  | string;

interface IExecDataProtectorResolvedConfig {
  dataprotectorContractAddress: AddressOrENS;
  sharingContractAddress: AddressOrENS;
  graphQLClient: GraphQLClient;
  ipfsNode: string;
  ipfsGateway: string;
  iexec: IExec;
  iexecDebug: IExec;
}

abstract class IExecDataProtectorModule {
  protected dataprotectorContractAddress!: AddressOrENS;

  protected sharingContractAddress!: AddressOrENS;

  protected graphQLClient!: GraphQLClient;

  protected ipfsNode!: string;

  protected ipfsGateway!: string;

  protected iexec!: IExec;

  protected iexecDebug!: IExec;

  private initPromise: Promise<void> | null = null;

  private ethProvider: EthersCompatibleProvider;

  private options: DataProtectorConfigOptions;

  constructor(
    ethProvider?: EthersCompatibleProvider,
    options?: DataProtectorConfigOptions
  ) {
    this.ethProvider = ethProvider || 'bellecour';
    this.options = options || {};
  }

  protected async init(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = this.resolveConfig().then((config) => {
        this.dataprotectorContractAddress = config.dataprotectorContractAddress;
        this.sharingContractAddress = config.sharingContractAddress;
        this.graphQLClient = config.graphQLClient;
        this.ipfsNode = config.ipfsNode;
        this.ipfsGateway = config.ipfsGateway;
        this.iexec = config.iexec;
        this.iexecDebug = config.iexecDebug;
      });
    }
    return this.initPromise;
  }

  private async resolveConfig(): Promise<IExecDataProtectorResolvedConfig> {
    const chainId = await getChainIdFromProvider(this.ethProvider);
    const chainDefaultConfig = CHAIN_CONFIG[chainId];

    const subgraphUrl = this.options?.subgraphUrl || chainDefaultConfig?.subgraphUrl;
    const dataprotectorContractAddress = this.options?.dataprotectorContractAddress || chainDefaultConfig?.dataprotectorContractAddress;
    const sharingContractAddress = this.options?.sharingContractAddress || chainDefaultConfig?.sharingContractAddress;
    const ipfsGateway = this.options?.ipfsGateway || chainDefaultConfig?.ipfsGateway;
    const ipfsNode = this.options?.ipfsNode || chainDefaultConfig?.ipfsNode;
    const smsURL = this.options?.iexecOptions?.smsDebugURL || chainDefaultConfig?.smsDebugURL;

    const missing = [];
    if (!subgraphUrl) missing.push('subgraphUrl');
    if (!dataprotectorContractAddress) missing.push('dataprotectorContractAddress');
    if (!sharingContractAddress) missing.push('sharingContractAddress');
    if (!ipfsGateway) missing.push('ipfsGateway');
    if (!ipfsNode) missing.push('ipfsNode');
    if (!smsURL) missing.push('smsDebugURL');

    if (missing.length > 0) {
      throw new Error(
        `Missing required configuration for chainId ${chainId}: ${missing.join(', ')}`
      );
    }

    let iexec: IExec, iexecDebug: IExec, graphQLClient: GraphQLClient;

    try {
      iexec = new IExec(
        { ethProvider: this.ethProvider },
        {
          ipfsGatewayURL: ipfsGateway,
          ...this.options?.iexecOptions,
        }
      );

      iexecDebug = new IExec(
        { ethProvider: this.ethProvider },
        {
          ipfsGatewayURL: ipfsGateway,
          ...this.options?.iexecOptions,
          smsURL,
        }
      );
    } catch (e: any) {
      throw new Error(`Unsupported ethProvider: ${e.message}`);
    }

    try {
      graphQLClient = new GraphQLClient(subgraphUrl);
    } catch (error: any) {
      throw new Error(`Failed to create GraphQLClient: ${error.message}`);
    }

    return {
      dataprotectorContractAddress: dataprotectorContractAddress.toLowerCase(),
      sharingContractAddress: sharingContractAddress.toLowerCase(),
      graphQLClient,
      ipfsNode,
      ipfsGateway,
      iexec,
      iexecDebug,
    };
  }
}

export { IExecDataProtectorModule };
