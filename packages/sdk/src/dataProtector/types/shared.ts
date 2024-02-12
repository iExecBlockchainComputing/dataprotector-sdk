/* eslint-disable @typescript-eslint/no-unused-vars */
import { Transaction } from 'ethers';
import { GraphQLClient } from 'graphql-request';
import { EnhancedWallet, IExec, Taskid as _Taskid, TeeFramework } from 'iexec';
import { IExecConfigOptions } from 'iexec/IExecConfig';

export type Address = string;
type ENS = string;

export type Taskid = _Taskid;

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

export type DataScalarType =
  | boolean
  | number
  | string
  | Uint8Array
  | ArrayBuffer;
export interface DataObject
  extends Record<string, DataObject | DataScalarType> {}

export type MimeType =
  | 'application/octet-stream'
  | 'application/pdf'
  | 'application/xml'
  | 'application/zip'
  | 'audio/midi'
  | 'audio/mpeg'
  | 'audio/x-wav'
  | 'image/bmp'
  | 'image/gif'
  | 'image/jpeg'
  | 'image/png'
  | 'image/webp'
  | 'video/mp4'
  | 'video/mpeg'
  | 'video/x-msvideo';

export type ScalarType = 'boolean' | 'number' | 'string';

export type DataSchemaEntryType = ScalarType | MimeType;
export interface DataSchema
  extends Record<string, DataSchema | DataSchemaEntryType> {}

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
};

type ProtectDataEncryptedFileUploadedMessage = {
  message: 'ENCRYPTED_FILE_UPLOADED';
  cid: string;
};

type ProtectDataProtectedDataDeploymentRequestMessage = {
  message: 'PROTECTED_DATA_DEPLOYMENT_REQUEST';
  owner: Address;
  name: string;
  schema: DataSchema;
};

type ProtectDataProtectedDataDeploymentSuccessMessage = {
  message: 'PROTECTED_DATA_DEPLOYMENT_SUCCESS';
  address: Address;
  owner: Address;
  creationTimestamp: number;
  txHash: string;
};

type ProtectDataPushSecretRequestMessage = {
  message: 'PUSH_SECRET_TO_SMS_REQUEST';
  teeFramework: TeeFramework;
};

type ProtectDataPushSecretSuccessMessage = {
  message: 'PUSH_SECRET_TO_SMS_SUCCESS';
  teeFramework: TeeFramework;
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

/**
 * Public props of a protected data
 */
export type ProtectedData = {
  name: string;
  address: Address;
  owner: Address;
  schema: DataSchema;
  creationTimestamp: number;
  collectionId?: number;
};

export type GraphQLResponseProtectedDatas = {
  protectedDatas: Array<{
    id: Address;
    name: string;
    owner: { id: AddressOrENS };
    schema: Array<Record<'id', string>>;
    creationTimestamp: string;
    collection: { id: bigint };
  }>;
};

/**
 * Configuration options for DataProtector.
 */
export type DataProtectorConfigOptions = {
  /**
   * The Ethereum contract address or ENS (Ethereum Name Service) for dataProtector smart contract.
   * If not provided, the default dataProtector contract address will be used.
   * @default{@link DEFAULT_CONTRACT_ADDRESS}
   */
  contractAddress?: AddressOrENS;

  /**
   * The Ethereum contract address or ENS (Ethereum Name Service) for dataProtector sharing smart contract.
   * If not provided, the default dataProtector sharing contract address will be used.
   * @default{@link DEFAULT_SHARING_CONTRACT_ADDRESS}
   */
  sharingContractAddress?: AddressOrENS;

  /**
   * The Ethereum contract address or ENS (Ethereum Name Service) for dataProtector collection smart contract.
   * If not provided, the default dataProtector collection contract address will be used.
   * @default{@link DEFAULT_COLLECTION_CONTRACT_ADDRESS}
   */
  collectionContractAddress?: AddressOrENS;

  /**
   * The subgraph URL for querying data.
   * If not provided, the default dataProtector subgraph URL will be used.
   * @default{@link DEFAULT_SUBGRAPH_URL}
   */
  subgraphUrl?: string;

  /**
   * Options specific to iExec integration.
   * If not provided, default iexec options will be used.
   */
  iexecOptions?: IExecConfigOptions;

  /**
   * The IPFS node URL.
   * If not provided, the default dataProtector IPFS node URL will be used.
   * @default{@link DEFAULT_IEXEC_IPFS_NODE}
   */
  ipfsNode?: string;

  /**
   * The IPFS gateway URL.
   * If not provided, the default dataProtector IPFS gateway URL will be used.
   * @default{@link DEFAULT_IPFS_GATEWAY}
   */
  ipfsGateway?: string;
};

/***************************************************************************
 *                        Sharing Types                                    *
 ***************************************************************************/
export type CollectionTokenIdParam = {
  collectionTokenId: number;
};

export type SuccessWithTransactionHash = {
  transaction: Transaction;
  success: boolean;
};

export type OnStatusUpdateFn = (params: {
  title: string;
  isDone: boolean;
  payload?: Record<string, string>;
}) => void;

// ---------------------Collection Types------------------------------------
export type GetCollectionsByOwnerParams = {
  ownerAddress: AddressOrENS;
};
