import { MimeType } from 'file-type';
import { IExec } from 'iexec';
import { GraphQLClient } from 'graphql-request';

export type Address = string;
type ENS = string;

/**
 * ethereum address or ENS name (Ethereum Name Service)
 */
export type AddressOrENS = Address | ENS;

export type IExecConsumer = {
  iexec: IExec;
};

export type SubgraphConsumer = {
  graphQLClient: GraphQLClient;
};

export type DataScalarType = boolean | number | string | Uint8Array;
export interface DataObject
  extends Record<string, DataObject | DataScalarType> {}

export type DataSchemaEntryType = 'boolean' | 'number' | 'string' | MimeType;
export interface DataSchema
  extends Record<string, DataSchema | DataSchemaEntryType> {}

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
   * use it to upload the encrypted data on a specific IPFS node
   */
  ipfsNodeMultiaddr?: string;
  /**
   * use it use a specific IPFS gateway
   */
  ipfsGateway?: string;
};

type ProtectDataDataExtractedMessage = {
  message: 'DATA_SCHEMA_EXTRACTED';
  schema: DataSchema;
};

type ProtectDataZipCreatedMessage = {
  message: 'ZIP_FILE_CREATED';
  zipFile: Uint8Array;
};

type ProtectDataEncryptionKeyCreatedMessage = {
  message: 'ENCRYPTION_KEY_CREATED';
  encryptionKey: string;
};

type ProtectDataFileEncryptedMessage = {
  message: 'FILE_ENCRYPTED';
  encryptedFile: Uint8Array;
  checksum: string;
};

type ProtectDataEncryptedFileUploadedMessage = {
  message: 'ENCRYPTED_FILE_UPLOADED';
  cid: string;
  multiaddr: string;
};

type ProtectDataProtectedDataDeploymentRequestMessage = {
  message: 'PROTECTED_DATA_DEPLOYMENT_REQUEST';
  owner: Address;
  name: string;
  schema: DataSchema;
  multiaddr: string;
  checksum: string;
};

type ProtectDataProtectedDataDeploymentSuccessMessage = {
  message: 'PROTECTED_DATA_DEPLOYMENT_SUCCESS';
  address: Address;
  owner: Address;
  creationTimestamp: BigInt;
  blockNumber: BigInt;
  txHash: string;
};

type ProtectDataPushSecretRequestMessage = {
  message: 'PUSH_SECRET_TO_SMS_REQUEST';
};

type ProtectDataPushSecretSuccessMessage = {
  message: 'PUSH_SECRET_TO_SMS_SUCCESS';
};

export type ProtectDataMessage =
  | ProtectDataDataExtractedMessage
  | ProtectDataZipCreatedMessage
  | ProtectDataEncryptionKeyCreatedMessage
  | ProtectDataFileEncryptedMessage
  | ProtectDataEncryptedFileUploadedMessage
  | ProtectDataProtectedDataDeploymentRequestMessage
  | ProtectDataProtectedDataDeploymentSuccessMessage
  | ProtectDataPushSecretRequestMessage
  | ProtectDataPushSecretSuccessMessage;

type RevokeAllAccessFetchProtectedDataMessage = {
  message: 'GRANTED_ACCESS_RETRIEVED';
  access: GrantedAccess[];
};
type RevokeAllAccessRevokeRequestMessage = {
  message: 'REVOKE_ONE_ACCESS_REQUEST';
  access: GrantedAccess;
};
type RevokeAllAccessRevokeSuccessMessage = {
  message: 'REVOKE_ONE_ACCESS_SUCCESS';
  txHash: string;
  access: GrantedAccess;
};
export type RevokeAllAccessMessage =
  | RevokeAllAccessRevokeRequestMessage
  | RevokeAllAccessRevokeSuccessMessage
  | RevokeAllAccessFetchProtectedDataMessage;

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
};

export type GrantedAccess = {
  dataset: string;
  datasetprice: string; // string notation allowed for big integers
  volume: string; // string notation allowed for big integers
  tag: string | string[]; // todo: correct type is `string` typing error in `iexec` package
  apprestrict: string;
  workerpoolrestrict: string;
  requesterrestrict: string;
  salt: string;
  sign: string;
};

export type RevokedAccess = {
  access: GrantedAccess;
  txHash: string;
};

/**
 * Public props of a protected data
 */
export type ProtectedData = {
  name: string;
  address: Address;
  owner: Address;
  schema: DataSchema;
  creationTimestamp: BigInt;
  checksum: string;
  blockNumber: BigInt;
  multiaddr: string;
  transactionHash: string;
};

/**
 * Secret props of a protected data
 */
type ProtectedDataSecretProps = {
  zipFile: Uint8Array;
  encryptionKey: string;
};

export type ProtectedDataWithSecretProps = ProtectedData &
  ProtectedDataSecretProps;

export type FetchProtectedDataParams = {
  requiredSchema?: DataSchema;
  owner?: string | string[];
};

/**
 * Internal props for querying the subgraph
 */

type Owner = {
  id: string;
};

type ProtectedDataQuery = {
  id: string;
  name: string;
  owner: Owner;
  jsonSchema: string;
  creationTimestamp: BigInt;
  checksum: string;
  blockNumber: BigInt;
  multiaddr: string;
  transactionHash: string;
};

export type GraphQLResponse = {
  protectedDatas: ProtectedDataQuery[];
};
