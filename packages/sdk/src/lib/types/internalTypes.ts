import { GraphQLClient } from 'graphql-request';
import { IExec } from 'iexec';
import { Address, AddressOrENS } from './commonTypes.js';

export type IExecConsumer = {
  iexec: IExec;
};

export type DataProtectorContractConsumer = {
  dataprotectorContractAddress: AddressOrENS;
};

export type SubgraphConsumer = {
  graphQLClient: GraphQLClient;
};

export type VoucherInfo = {
  owner: Address;
  address: Address;
  type: bigint;
  balance: bigint;
  expirationTimestamp: bigint;
  sponsoredApps: Address[];
  sponsoredDatasets: Address[];
  sponsoredWorkerpools: Address[];
  allowanceAmount: bigint;
  authorizedAccounts: Address[];
};
