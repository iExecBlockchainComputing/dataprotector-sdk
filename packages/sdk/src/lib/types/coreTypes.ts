import {
  Address,
  AddressOrENS,
  DataSchema,
  OnStatusUpdateFn,
} from './commonTypes.js';

/***************************************************************************
 *                        DataProtector Types                              *
 ***************************************************************************/
export type DataScalarType =
  | boolean
  | number
  | bigint
  | string
  | Uint8Array
  | ArrayBuffer
  | File;
export interface DataObject
  extends Record<string, DataObject | DataScalarType> {}

// ---------------------ProtectData Types------------------------------------
export type IpfsNodeAndGateway = {
  /**
   * use it to upload the encrypted data on a specific IPFS node
   */
  ipfsNode?: string;

  /**
   * use a specific IPFS gateway
   */
  ipfsGateway?: string;
};

export type ProtectDataStatuses =
  | 'EXTRACT_DATA_SCHEMA'
  | 'CREATE_ZIP_FILE'
  | 'CREATE_ENCRYPTION_KEY'
  | 'ENCRYPT_FILE'
  | 'UPLOAD_ENCRYPTED_FILE'
  | 'DEPLOY_PROTECTED_DATA'
  | 'PUSH_SECRET_TO_SMS';

export type OneProtectDataStatus = {
  title: ProtectDataStatuses;
  isDone: boolean;
  payload?: Record<string, string>;
};

export type ProtectDataParams = {
  /**
   * data to protect
   */
  data: DataObject;

  /**
   * name of the data (this is public)
   *
   * if no `name` is specified, the protected data name will be an empty string
   */
  name?: string;

  /**
   * Callback function that will get called at each step of the process
   */
  onStatusUpdate?: OnStatusUpdateFn<ProtectDataStatuses>;
};

/**
 * Public props of a protected data
 */
export type ProtectedData = {
  name: string;
  address: Address;
  owner: Address;
  schema: DataSchema;
  creationTimestamp: number;
};

/**
 * Secret props of a protected data
 * Exported as it is mentioned in the docs
 */
export type ProtectedDataCreationProps = {
  transactionHash: string;
  zipFile: Uint8Array;
  encryptionKey: string;
};

export type ProtectedDataWithSecretProps = ProtectedData &
  ProtectedDataCreationProps;

// ---------------------GetGrantedAccess Types------------------------------------
export type GetGrantedAccessParams = {
  /**
   * Protected Data address or ENS
   *
   * Default fetch for any protectedData
   */

  protectedData?: AddressOrENS | 'any';

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

  /**
   * Index of the page to fetch
   */
  page?: number;

  /**
   * Size of the page to fetch
   */
  pageSize?: number;
};

export type GetProtectedDataParams = {
  protectedDataAddress?: AddressOrENS;
  requiredSchema?: DataSchema;
  owner?: AddressOrENS;
  createdAfterTimestamp?: number;
  page?: number;
  pageSize?: number;
};

export type GrantAccessStatuses =
  | 'CREATE_DATASET_ORDER'
  | 'PUBLISH_DATASET_ORDER';

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

  /**
   * Callback function that will get called at each step of the process
   */
  onStatusUpdate?: OnStatusUpdateFn<GrantAccessStatuses>;
};

export type GrantedAccess = {
  dataset: string;
  datasetprice: string; // string notation allowed for big integers
  volume: string; // string notation allowed for big integers
  tag: string;
  apprestrict: string;
  workerpoolrestrict: string;
  requesterrestrict: string;
  salt: string;
  sign: string;
};

export type GrantedAccessResponse = {
  count: number;
  grantedAccess: GrantedAccess[];
};

// ---------------------RevokeAccess Types------------------------------------
export type RevokeAllAccessStatuses =
  | 'RETRIEVE_ALL_GRANTED_ACCESS'
  | 'REVOKE_ONE_ACCESS';

export type RevokeAllAccessParams = {
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

  /**
   * Callback function that will get called at each step of the process
   */
  onStatusUpdate?: OnStatusUpdateFn<RevokeAllAccessStatuses>;
};

export type RevokedAccess = {
  access: GrantedAccess;
  txHash: string;
};

// ---------------------TransferProtectedData Types------------------------------------
export type TransferParams = {
  protectedData: AddressOrENS;
  newOwner: AddressOrENS;
};

export type TransferResponse = {
  address: Address;
  to: AddressOrENS;
  txHash: string;
};

// ---------------------ProcessProtectedData Types------------------------------------
export type ProcessProtectedDataParams = {
  /**
   * Address or ENS (Ethereum Name Service) of the protected data.
   */
  protectedData: AddressOrENS;

  /**
   * Address or ENS of the authorized application to process the protected data.
   */
  app: AddressOrENS;

  /**
   * The maximum price per task for processing the protected data.
   * It is the sum of the application price, dataset price and workerpool price per task.
  @default = 0
  */
  maxPrice?: number;

  /**
   * Arguments to pass to the application during execution.
   */
  args?: string;

  /**
   * The input file required for the application's execution (direct download URL).
   */
  inputFiles?: string[];

  /**
   * Requester secrets necessary for the application's execution.
   * It is represented as a mapping of numerical identifiers to corresponding secrets.
   */
  secrets?: Record<number, string>;

  /**
   * The workerpool to use for the application's execution. (default iExec production workerpool)
   */
  workerpool?: AddressOrENS | 'any';
};
