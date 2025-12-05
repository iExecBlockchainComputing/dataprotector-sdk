import { Address, AddressOrENS } from './commonTypes.js';

/***************************************************************************
 *                        Subgraph Types                                    *
 ***************************************************************************/

// ---------------------ProtectedData Types------------------------------------

export type OneProtectedData = {
  id: Address;
  name: string;
  owner: { id: AddressOrENS };
  schema: Array<Record<'id', string>>;
  creationTimestamp: number;
  multiaddr: string; // hex representation. Ex: "0xa50322122038d76d7059153e707cd0951cf2ff64d17f69352a285503800c7787c3af0c63dd"
};

export type ProtectedDatasGraphQLResponse = {
  protectedDatas: OneProtectedData[];
};
