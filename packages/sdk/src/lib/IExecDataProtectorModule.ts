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
import { AddressOrENS, Web3SignerProvider } from './types/commonTypes.js';
import { DataProtectorConfigOptions } from './types/dataProtectorTypes.js';

class IExecDataProtectorModule {
  protected contractAddress: AddressOrENS;

  protected sharingContractAddress: AddressOrENS;

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
    this.sharingContractAddress =
      options?.sharingContractAddress || DEFAULT_SHARING_CONTRACT_ADDRESS;
    this.ipfsNode = options?.ipfsNode || DEFAULT_IEXEC_IPFS_NODE;
    this.ipfsGateway = options?.ipfsGateway || DEFAULT_IPFS_GATEWAY;
  }
}

export { IExecDataProtectorModule };
