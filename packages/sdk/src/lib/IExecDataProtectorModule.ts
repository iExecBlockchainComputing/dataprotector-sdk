import { Eip1193Provider } from 'ethers';
import { GraphQLClient } from 'graphql-request';
import { IExec } from 'iexec';
import {
  DEFAULT_CONTRACT_ADDRESS,
  DEFAULT_IEXEC_IPFS_NODE,
  DEFAULT_IPFS_GATEWAY,
  DEFAULT_SUBGRAPH_URL,
} from '../config/config.js';
import {
  AddressOrENS,
  DataProtectorConfigOptions,
  Web3SignerProvider,
} from './types/index.js';

abstract class IExecDataProtectorModule {
  protected contractAddress: AddressOrENS;

  protected graphQLClient: GraphQLClient;

  protected ipfsNode: string;

  protected ipfsGateway: string;

  protected iexec: IExec;

  constructor(
    ethProvider: Eip1193Provider | Web3SignerProvider,
    options?: DataProtectorConfigOptions
  ) {
    try {
      this.iexec = new IExec({ ethProvider }, options?.iexecOptions);
    } catch (e) {
      throw new Error(`Unsupported ethProvider, ${e.message}`);
    }
    try {
      this.graphQLClient = new GraphQLClient(
        options?.subgraphUrl || DEFAULT_SUBGRAPH_URL
      );
    } catch (error) {
      throw new Error(`Failed to create GraphQLClient: ${error.message}`);
    }
    this.contractAddress = options?.contractAddress || DEFAULT_CONTRACT_ADDRESS;
    this.ipfsNode = options?.ipfsNode || DEFAULT_IEXEC_IPFS_NODE;
    this.ipfsGateway = options?.ipfsGateway || DEFAULT_IPFS_GATEWAY;
  }
}

export { IExecDataProtectorModule };
