import IExec from 'iexec/IExec';

type Address = string;
type ENS = string;

/**
 * ethereum address or ENS name (Ethereum Name Service)
 */
export type AddressOrENS = Address | ENS;

export type IExecConsumer = {
  iexec: IExec;
};

export type DataScalarType = boolean | number | string | Uint8Array;
export interface DataObject
  extends Record<string, DataObject | DataScalarType> {}

export type DataSchemaEntryType =
  | 'boolean'
  | 'number'
  | 'string'
  | 'bytes:<mime>'; // todo: list all supported types
export interface DataSchema
  extends Record<string, DataSchema | DataSchemaEntryType> {}

export type ProtectDataParams = {
  /**
   * data to protect
   */
  data: DataObject;
  /**
   * name of the data (this is public)
   */
  name: string;
  ethersProvider?: any; // todo: to remove?
  ipfsNodeMultiaddr?: string;
  ipfsGateway?: string;
};

export type GrantAccessParams = {
  /**
   * Protected Data address or ENS
   */
  protectedData: AddressOrENS;
  /**
   * Address or ENS of the app authorized to use the `protectedData`
   */
  authorizedApp: AddressOrENS;
  /**
   * Address or ENS of the user authorized to use the `protectedData`
   *
   * The address zero `0x0000000000000000000000000000000000000000` can be use to authorize any user to use the `protectedData`.
   */
  authorizedUser: AddressOrENS;
  /**
   * Price paid by the `authorizedUser` per access to the `protectedData` labeled in nRLC.
   */
  pricePerAccess?: number;
  /**
   * Total number of access to the `protectedData` for the generated authorization.
   */
  numberOfAccess?: number;
  tag?: string | string[]; // todo: to remove, infer tag from authorized app
};

export type FetchGrantedAccessParams = {
  /**
   * Protected Data address or ENS
   */
  protectedData: AddressOrENS;
  /**
   * Address or ENS of the app authorized to use the `protectedData`
   *
   * Default fetch for any app
   */
  authorizedApp?: AddressOrENS | 'any';
  /**
   * Address or ENS of the user authorized to use the `protectedData`
   *
   * Default fetch for any user
   */
  authorizedUser?: AddressOrENS | 'any';
};

export type RevokeAccessParams = {
  /**
   * Protected Data address or ENS
   */
  protectedData: AddressOrENS;
  /**
   * Address or ENS of the app authorized to use the `protectedData`
   *
   * Default revoke for any app
   */
  authorizedApp?: AddressOrENS | 'any';
  /**
   * Address or ENS of the user authorized to use the `protectedData`
   *
   * Default revoke for any user
   */
  authorizedUser?: AddressOrENS | 'any';
};

export type Order = {
  dataset: string;
  datasetprice: number;
  volume: number;
  tag: string | string[]; // todo: correct type is `string` typing error in `iexec` package
  apprestrict: string;
  workerpoolrestrict: string;
  requesterrestrict: string;
  salt: string;
  sign: string;
};

export type ProtectedData = {
  datasetChecksum: string;
  datasetMultiaddr: string | Buffer;
  datasetName: string;
  owner: string;
  schema: JSON;
};

export interface Schema<T = string> {
  [key: string]: T | Schema<T>;
}

export type FetchProtectedDataParams = {
  requireSchema?: Schema;
  owner?: string | string[];
};
