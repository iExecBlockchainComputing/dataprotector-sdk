/* eslint-disable @typescript-eslint/no-unused-vars */
import { EnhancedWallet } from 'iexec';
import { IExecConfigOptions } from 'iexec/IExecConfig';

export type { Taskid } from 'iexec';

/***************************************************************************
 *                        Common Types                                     *
 ***************************************************************************/

type ENS = string;

export type Address = string;

export type Web3SignerProvider = EnhancedWallet;

/**
 * ethereum address or ENS name (Ethereum Name Service)
 */
export type AddressOrENS = Address | ENS;

export type OnStatusUpdateFn<T> = (params: {
  title: T;
  isDone: boolean;
  payload?: Record<string, any>;
}) => void;

// ---------------------Constructor Types------------------------------------
/**
 * Configuration options for DataProtector.
 */
export type DataProtectorConfigOptions = {
  /**
   * The Ethereum contract address or ENS (Ethereum Name Service) for dataProtector smart contract.
   * If not provided, the default dataProtector contract address will be used.
   * @default{@link DEFAULT_CONTRACT_ADDRESS}
   */
  dataprotectorContractAddress?: AddressOrENS;

  /**
   * The Ethereum contract address or ENS (Ethereum Name Service) for dataProtector sharing smart contract.
   * If not provided, the default dataProtector sharing contract address will be used.
   * @default{@link DEFAULT_SHARING_CONTRACT_ADDRESS}
   */
  sharingContractAddress?: AddressOrENS;

  /**
   * The subgraph URL for querying data.
   * If not provided, the default dataProtector subgraph URL will be used.
   * @default{@link DEFAULT_SUBGRAPH_URL}
   */
  subgraphUrl?: string;

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

  /**
   * Options specific to iExec integration.
   * If not provided, default iexec options will be used.
   */
  iexecOptions?: IExecConfigOptionsExtended;

  /**
   * if true allows using a provider connected to an experimental networks (default false)
   *
   * ⚠️ experimental networks are networks on which the iExec's stack is partially deployed, experimental networks can be subject to instabilities or discontinuity. Access is provided without warranties.
   */
  allowExperimentalNetworks?: boolean;
};

interface IExecConfigOptionsExtended extends IExecConfigOptions {
  // adds smsDebugURL to possible options, used ton configure an IExec debug instance seamlessly (no JS doc test purpose only)
  smsDebugURL?: string;
}

// ---------------------ProtectedData Schema Types------------------------------------
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

export type ScalarType = 'bool' | 'i128' | 'f64' | 'string';

export type DataSchemaEntryType = ScalarType | MimeType;

export interface DataSchema
  extends Record<string, DataSchema | DataSchemaEntryType> {}

// these scalar types existed prior to dataprotector v2 and can still be used for searching pre-v2 protected data
export type LegacyScalarType = 'boolean' | 'number' | 'string';

export type SearchableSchemaEntryType =
  | ScalarType
  | MimeType
  | LegacyScalarType;

export interface SearchableDataSchema
  extends Record<
    string,
    | SearchableDataSchema
    | SearchableSchemaEntryType
    | SearchableSchemaEntryType[]
  > {}

export type MatchOptions = {
  useVoucher: boolean;
  voucherAddress?: string;
};

export type DefaultWorkerpoolConsumer = {
  defaultWorkerpool: AddressOrENS;
};
