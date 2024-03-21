import { GraphQLClient } from 'graphql-request';
import { IExec } from 'iexec';
import { AddressOrENS } from './commonTypes.js';

export type IExecConsumer = {
  iexec: IExec;
};

export type DataProtectorContractConsumer = {
  dataprotectorContractAddress: AddressOrENS;
};

export type SubgraphConsumer = {
  graphQLClient: GraphQLClient;
};
