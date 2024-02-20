/* eslint-disable @typescript-eslint/no-unused-vars */
import { GraphQLClient } from 'graphql-request';
import { EnhancedWallet, IExec } from 'iexec';
export type { Taskid } from 'iexec';

/***************************************************************************
 *                        Common Types                                     *
 ***************************************************************************/
export type OnStatusUpdateFn<T> = (params: {
  title: T;
  isDone: boolean;
  payload?: Record<string, string>;
}) => void;

type ENS = string;

export type Address = string;

export type Web3SignerProvider = EnhancedWallet;

/**
 * ethereum address or ENS name (Ethereum Name Service)
 */
export type AddressOrENS = Address | ENS;

export type IExecConsumer = {
  iexec: IExec;
};

export type AddressOrENSConsumer = {
  contractAddress?: AddressOrENS;
};

export type SubgraphConsumer = {
  graphQLClient: GraphQLClient;
};
