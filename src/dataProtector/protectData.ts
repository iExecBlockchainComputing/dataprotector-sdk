import { DataSchema, IExecConsumer, ProtectDataParams } from './types.js';
import {
  DEFAULT_IEXEC_IPFS_NODE_MULTIADDR,
  DEFAULT_IPFS_GATEWAY,
} from '../config/config.js';
import { throwIfMissing } from '../utils/validators.js';
import {
  protectDataObservable,
  ProtectDataMessage,
} from './protectDataObservable.js';

export const protectData = ({
  iexec = throwIfMissing(),
  data = throwIfMissing(),
  name = throwIfMissing(),
  ipfsNodeMultiaddr = DEFAULT_IEXEC_IPFS_NODE_MULTIADDR,
  ipfsGateway = DEFAULT_IPFS_GATEWAY,
}: IExecConsumer & ProtectDataParams): Promise<{
  dataAddress: string;
  encryptionKey: string;
  multiaddr: string;
  dataSchema: DataSchema;
  zipFile: Uint8Array;
}> => {
  let dataAddress: string;
  let encryptionKey: string;
  let multiaddr: string;
  let dataSchema: DataSchema;
  let zipFile: Uint8Array;
  return new Promise((resolve, reject) => {
    protectDataObservable({
      iexec,
      data,
      name,
      ipfsNodeMultiaddr,
      ipfsGateway,
    }).subscribe(
      (data: ProtectDataMessage) => {
        const { message } = data;
        switch (message) {
          case 'DATA_SCHEMA_EXTRACTED':
            dataSchema = data.dataSchema;
            break;
          case 'ZIP_FILE_CREATED':
            zipFile = data.zipFile;
            break;
          case 'ENCRYPTION_KEY_CREATED':
            encryptionKey = data.encryptionKey;
            break;
          case 'ENCRYPTED_FILE_UPLOADED':
            multiaddr = data.multiaddr;
            break;
          case 'PROTECTED_DATA_DEPLOYMENT_SUCCESS':
            dataAddress = data.dataAddress;
            break;
          default:
        }
      },
      (e: Error) => reject(e),
      () =>
        resolve({
          dataSchema,
          zipFile,
          dataAddress,
          encryptionKey,
          multiaddr,
        })
    );
  });
};
