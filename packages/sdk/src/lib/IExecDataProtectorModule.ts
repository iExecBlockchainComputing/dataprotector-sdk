import { AbstractProvider, AbstractSigner, Eip1193Provider } from 'ethers';
import { GraphQLClient } from 'graphql-request';
import { IExec } from 'iexec';
import {
  getChainConfig,
  DEFAULT_ARWEAVE_UPLOAD_API,
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
  defaultWorkerpool: string;
  iexec: IExec;
}

abstract class IExecDataProtectorModule {
  protected dataprotectorContractAddress!: AddressOrENS;

  protected sharingContractAddress!: AddressOrENS;

  protected graphQLClient!: GraphQLClient;

  protected ipfsNode!: string;

  protected ipfsGateway!: string;

  protected arweaveUploadApi: string = DEFAULT_ARWEAVE_UPLOAD_API;

  protected defaultWorkerpool!: string;

  protected iexec!: IExec;

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
        this.defaultWorkerpool = config.defaultWorkerpool;
        this.iexec = config.iexec;
      });
    }
    return this.initPromise;
  }

  private async resolveConfig(): Promise<IExecDataProtectorResolvedConfig> {
    const chainId = await getChainIdFromProvider(this.ethProvider);
    const chainDefaultConfig = getChainConfig(chainId, {
      allowExperimentalNetworks: this.options.allowExperimentalNetworks,
    });

    const subgraphUrl =
      this.options?.subgraphUrl || chainDefaultConfig?.subgraphUrl;
    const dataprotectorContractAddress =
      this.options?.dataprotectorContractAddress ||
      chainDefaultConfig?.dataprotectorContractAddress;
    const sharingContractAddress =
      this.options?.sharingContractAddress ||
      chainDefaultConfig?.sharingContractAddress;
    const ipfsGateway =
      this.options?.ipfsGateway || chainDefaultConfig?.ipfsGateway;
    const defaultWorkerpool = chainDefaultConfig?.workerpoolAddress;
    const ipfsNode = this.options?.ipfsNode || chainDefaultConfig?.ipfsNode;

    const missing = [];
    if (!subgraphUrl) missing.push('subgraphUrl');
    if (!dataprotectorContractAddress)
      missing.push('dataprotectorContractAddress');
    if (!sharingContractAddress) missing.push('sharingContractAddress');
    if (!ipfsGateway) missing.push('ipfsGateway');
    if (!defaultWorkerpool) missing.push('defaultWorkerpool');
    if (!ipfsNode) missing.push('ipfsNode');

    if (missing.length > 0) {
      throw new Error(
        `Missing required configuration for chainId ${chainId}: ${missing.join(
          ', '
        )}`
      );
    }

    let iexec: IExec, graphQLClient: GraphQLClient;

    try {
      iexec = new IExec(
        { ethProvider: this.ethProvider },
        {
          ipfsGatewayURL: ipfsGateway,
          ...this.options?.iexecOptions,
          allowExperimentalNetworks: this.options.allowExperimentalNetworks,
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
      defaultWorkerpool,
      graphQLClient,
      ipfsNode,
      ipfsGateway,
      iexec,
    };
  }
}

export { IExecDataProtectorModule };
