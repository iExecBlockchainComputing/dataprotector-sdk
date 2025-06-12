import {
  Address,
  AddressOrENS,
  DataSchema,
  OnStatusUpdateFn,
  SearchableDataSchema,
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
  | 'PUSH_SECRET_TO_SMS'
  | 'PUSH_SECRET_TO_DEBUG_SMS';

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
   * allow to use the protected data in TEE debug apps (default `false`)
   *
   * ⚠️ TEE debug apps runs in enclave simulation mode which does not prevent the worker host to inspect data or temper the app output.
   * You should never set this parameter to `true` with real data, use it for development purpose only.
   *
   * setting this parameter to `true` adds a signature request to the protectData workflow, this signature is used to push the protected data encryption key to the debug Secret Management System
   */
  allowDebug?: boolean;

  /**
   * specify the platform used for storing the encrypted payload of the protected data
   *
   * - `"ipfs"` (default): https://ipfs.tech/
   * - `"arweave"`: https://arweave.org/
   */
  uploadMode?: 'ipfs' | 'arweave';

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
  multiaddr?: string; // Ex: "/p2p/QmaiUykRQKPC2PDXvmiqdhDm553JybgLurUUiDYy78rMgY"
};

/**
 * Secret props of a protected data
 * Exported as it is mentioned in the docs
 */
export type ProtectedDataCreationProps = {
  transactionHash: string;
  zipFile: Uint8Array;
  encryptionKey: string;
  multiaddr: string;
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

  protectedData?: AddressOrENS;

  /**
   * Address or ENS of the app authorized to use the `protectedData`
   *
   * Default fetch for any app
   */
  authorizedApp?: AddressOrENS;

  /**
   * Address or ENS of the user authorized to use the `protectedData`
   *
   * Default fetch for any user
   */
  authorizedUser?: AddressOrENS;

  /**
   * Fetches the orderbook strictly specified for this user
   *
   * Default false for any user
   */
  isUserStrict?: boolean;

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
  requiredSchema?: SearchableDataSchema;
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

// ---------------------GetResultFromCompletedTask Types------------------------------------

export type GetResultFromCompletedTaskStatuses =
  | 'CONSUME_RESULT_DOWNLOAD'
  | 'CONSUME_RESULT_DECRYPT';

export type GetResultFromCompletedTaskParams = {
  taskId: string;
  path?: string;
  pemPrivateKey?: string;
  onStatusUpdate?: OnStatusUpdateFn<GetResultFromCompletedTaskStatuses>;
};

export type GetResultFromCompletedTaskResponse = {
  result: ArrayBuffer;
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
  authorizedApp?: AddressOrENS;

  /**
   * Address or ENS of the user authorized to use the `protectedData`
   *
   * Default revoke for any user
   */
  authorizedUser?: AddressOrENS;

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
export type ProcessProtectedDataStatuses =
  | 'FETCH_ORDERS'
  | 'FETCH_PROTECTED_DATA_ORDERBOOK'
  | 'FETCH_APP_ORDERBOOK'
  | 'FETCH_WORKERPOOL_ORDERBOOK'
  | 'PUSH_REQUESTER_SECRET'
  | 'REQUEST_TO_PROCESS_PROTECTED_DATA'
  | 'CONSUME_TASK'
  | 'CONSUME_RESULT_DOWNLOAD'
  | 'CONSUME_RESULT_DECRYPT';

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
   * Address of an ERC734 whitelist contract authorized to access the protectedData, including the current user address. This address will be used to search for granted accesses instead of the user address.
   */
  userWhitelist?: Address;

  /**
   * The maximum price of dataset per task for processing the protected data.
  @default = 0
  */
  dataMaxPrice?: number;

  /**
   * The maximum price of application per task for processing the protected data.
  @default = 0
  */
  appMaxPrice?: number;

  /**
   * The maximum price of workerpool per task for processing the protected data.
  @default = 0
  */
  workerpoolMaxPrice?: number;

  /**
   * The file name of the desired file in the returned ZIP file.
   */
  path?: string;

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
  workerpool?: AddressOrENS;

  /**
   * A boolean that indicates whether to use a voucher or no.
   */
  useVoucher?: boolean;

  /**
   * Override the voucher contract to use, must be combined with useVoucher: true the user must be authorized by the voucher's owner to use it.
   */
  voucherOwner?: AddressOrENS;

  /**
   * Callback function that will get called at each step of the process
   */
  onStatusUpdate?: OnStatusUpdateFn<ProcessProtectedDataStatuses>;
};

export type ProcessProtectedDataResponse = {
  txHash: string;
  dealId: string;
  taskId: string;
  result: ArrayBuffer;
};
