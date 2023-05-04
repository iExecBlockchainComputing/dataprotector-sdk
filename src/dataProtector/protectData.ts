import {
  DataSchema,
  IExecConsumer,
  ProtectDataParams,
  ProtectDataMessage,
  ProtectedDataWithSecretProps,
  Address,
} from './types.js';
import {
  DEFAULT_IEXEC_IPFS_NODE_MULTIADDR,
  DEFAULT_IPFS_GATEWAY,
} from '../config/config.js';
import { throwIfMissing } from '../utils/validators.js';
import { protectDataObservable } from './protectDataObservable.js';

export const protectData = ({
  iexec = throwIfMissing(),
  data,
  name = '',
  ipfsNodeMultiaddr = DEFAULT_IEXEC_IPFS_NODE_MULTIADDR,
  ipfsGateway = DEFAULT_IPFS_GATEWAY,
}: IExecConsumer &
  ProtectDataParams): Promise<ProtectedDataWithSecretProps> => {
  let address: Address;
  let owner: Address;
  let encryptionKey: string;
  let multiaddr: string;
  let schema: DataSchema;
  let zipFile: Uint8Array;
  return new Promise((resolve, reject) => {
    try {
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
              schema = data.schema;
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
              address = data.address;
              owner = data.owner;
              break;
            default:
          }
        },
        (e: Error) => reject(e),
        () =>
          resolve({
            address,
            name,
            owner,
            schema,
            zipFile,
            encryptionKey,
            multiaddr,
          })
      );
    } catch (e) {
      reject(e);
    }
  });
};
