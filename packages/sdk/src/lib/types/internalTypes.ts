import { GraphQLClient } from 'graphql-request';
import { IExec } from 'iexec';
import { Address } from './commonTypes.js';

export type IExecConsumer = {
  iexec: IExec;
};

export type DataProtectorContractConsumer = {
  dataprotectorContractAddress: Address;
};

export type ArweaveUploadConsumer = {
  arweaveUploadApi?: string;
};

export type SubgraphConsumer = {
  graphQLClient: GraphQLClient;
};

export type PocoSubgraphConsumer = {
  pocoSubgraphClient: GraphQLClient;
};

export type NetworkNameConsumer = {
  networkName: string;
};
