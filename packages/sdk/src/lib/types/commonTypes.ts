/* eslint-disable @typescript-eslint/no-unused-vars */
import { EnhancedWallet } from 'iexec';
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
