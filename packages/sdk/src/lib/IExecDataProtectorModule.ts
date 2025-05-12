import {
  AbstractProvider,
  AbstractSigner,
  Eip1193Provider,
} from 'ethers';
import { GraphQLClient } from 'graphql-request';
import { IExec } from 'iexec';
import {
  CHAIN_CONFIG,
  DEFAULT_CHAIN_ID,
} from '../config/config.js';
import {
  AddressOrENS,
  DataProtectorConfigOptions,
  Web3SignerProvider,
} from './types/index.js';
import { getChainIdFromProvider } from '../utils/getChainId.js';

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
    const config = CHAIN_CONFIG[chainId] || CHAIN_CONFIG[DEFAULT_CHAIN_ID];

    let iexec: IExec, iexecDebug: IExec, graphQLClient: GraphQLClient;

    try {
      iexec = new IExec(
        { ethProvider: this.ethProvider },
        {
          ipfsGatewayURL: config.ipfsGateway,
          ...this.options?.iexecOptions,
        }
      );

      iexecDebug = new IExec(
        { ethProvider: this.ethProvider },
        {
          ipfsGatewayURL: config.ipfsGateway,
          ...this.options?.iexecOptions,
          smsURL: this.options?.iexecOptions?.smsDebugURL || config.smsDebugURL,
        }
      );
    } catch (e: any) {
      throw new Error(`Unsupported ethProvider: ${e.message}`);
    }

    try {
      graphQLClient = new GraphQLClient(
        this.options?.subgraphUrl || config.subgraphUrl
      );
    } catch (error: any) {
      throw new Error(`Failed to create GraphQLClient: ${error.message}`);
    }

    return {
      dataprotectorContractAddress:
        this.options?.dataprotectorContractAddress?.toLowerCase() ||
        config.dataprotectorContractAddress,
      sharingContractAddress:
        this.options?.sharingContractAddress?.toLowerCase() ||
        config.sharingContractAddress,
      graphQLClient,
      ipfsNode: this.options?.ipfsNode || config.ipfsNode,
      ipfsGateway: config.ipfsGateway,
      iexec,
      iexecDebug,
    };
  }
}

export { IExecDataProtectorModule };
