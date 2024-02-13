/* eslint-disable @typescript-eslint/no-unused-vars */
import { GraphQLClient } from 'graphql-request';
import { EnhancedWallet, IExec } from 'iexec';
export {Taskid} from 'iexec'
/***************************************************************************
 *                        Common Types                                     *
 ***************************************************************************/
export type Address = string;
type ENS = string;

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
