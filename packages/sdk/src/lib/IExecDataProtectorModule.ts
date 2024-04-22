import { Eip1193Provider } from 'ethers';
import { GraphQLClient } from 'graphql-request';
import { IExec } from 'iexec';
import {
  DEFAULT_CONTRACT_ADDRESS,
  DEFAULT_IEXEC_IPFS_NODE,
  DEFAULT_IPFS_GATEWAY,
  DEFAULT_SHARING_CONTRACT_ADDRESS,
  DEFAULT_SUBGRAPH_URL,
} from '../config/config.js';
import {
  AddressOrENS,
  DataProtectorConfigOptions,
  Web3SignerProvider,
} from './types/index.js';

abstract class IExecDataProtectorModule {
  protected dataprotectorContractAddress: AddressOrENS;

  protected sharingContractAddress: AddressOrENS;

  protected graphQLClient: GraphQLClient;

  protected ipfsNode: string;

  protected ipfsGateway: string;

  protected iexec: IExec;

  constructor(
    ethProvider: Eip1193Provider | Web3SignerProvider,
    options?: DataProtectorConfigOptions
  ) {
    const ipfsGateway = options?.ipfsGateway || DEFAULT_IPFS_GATEWAY;

    try {
      this.iexec = new IExec(
        { ethProvider },
        {
          ipfsGatewayURL: ipfsGateway,
          ...options?.iexecOptions,
        }
      );
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
    this.dataprotectorContractAddress =
      options?.dataprotectorContractAddress?.toLowerCase() ||
      DEFAULT_CONTRACT_ADDRESS;
    this.sharingContractAddress =
      options?.sharingContractAddress?.toLowerCase() ||
      DEFAULT_SHARING_CONTRACT_ADDRESS;
    this.ipfsNode = options?.ipfsNode || DEFAULT_IEXEC_IPFS_NODE;
    this.ipfsGateway = ipfsGateway;
  }
}

export { IExecDataProtectorModule };
