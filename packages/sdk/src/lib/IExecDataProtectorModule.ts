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

abstract class IExecDataProtectorModule {
  protected dataprotectorContractAddress: AddressOrENS;

  protected sharingContractAddress: AddressOrENS;

  protected graphQLClient: GraphQLClient;

  protected ipfsNode: string;

  protected ipfsGateway: string;

  protected iexec: IExec;

  protected iexecDebug: IExec;

  protected constructor() {
    // Prevent direct instantiation; use create() instead
  }

  static async create(
    ethProvider?: EthersCompatibleProvider,
    options?: DataProtectorConfigOptions
  ): Promise<IExecDataProtectorModule> {
    const instance = Object.create(this.prototype) as IExecDataProtectorModule;
    const resolvedEthProvider = ethProvider || 'bellecour';
    const chainId = await getChainIdFromProvider(resolvedEthProvider);
    const config = CHAIN_CONFIG[chainId] || CHAIN_CONFIG[DEFAULT_CHAIN_ID];

    try {
      instance.iexec = new IExec(
        { ethProvider: resolvedEthProvider },
        {
          ipfsGatewayURL: config.ipfsGateway,
          ...options?.iexecOptions,
        }
      );

      instance.iexecDebug = new IExec(
        { ethProvider: resolvedEthProvider },
        {
          ipfsGatewayURL: config.ipfsGateway,
          ...options?.iexecOptions,
          smsURL: options?.iexecOptions?.smsDebugURL || config.smsDebugURL,
        }
      );
    } catch (e: any) {
      throw new Error(`Unsupported ethProvider: ${e.message}`);
    }

    try {
      instance.graphQLClient = new GraphQLClient(
        options?.subgraphUrl || config.subgraphUrl
      );
    } catch (error: any) {
      throw new Error(`Failed to create GraphQLClient: ${error.message}`);
    }

    instance.dataprotectorContractAddress =
      options?.dataprotectorContractAddress?.toLowerCase() ||
      config.dataprotectorContractAddress;

    instance.sharingContractAddress =
      options?.sharingContractAddress?.toLowerCase() ||
      config.sharingContractAddress;

    instance.ipfsNode = options?.ipfsNode || config.ipfsNode;
    instance.ipfsGateway = config.ipfsGateway;

    return instance;
  }
}

export { IExecDataProtectorModule };
