import { GraphQLClient } from 'graphql-request';
import { Address, BN, IExec } from 'iexec';
import { AddressOrENS } from './commonTypes.js';

export type IExecConsumer = {
  iexec: IExec;
};

export type IExecDebugConsumer = {
  /**
   * iexec instance connected to debug SMS
   */
  iexecDebug: IExec;
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
  type: BN;
  balance: BN;
  expirationTimestamp: BN;
  sponsoredApps: Address[];
  sponsoredDatasets: Address[];
  sponsoredWorkerpools: Address[];
  allowanceAmount: BN;
  authorizedAccounts: Address[];
};
