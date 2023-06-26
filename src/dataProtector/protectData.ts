import {
  DEFAULT_DATA_NAME,
  DEFAULT_IEXEC_IPFS_NODE,
  DEFAULT_IPFS_GATEWAY,
} from '../config/config.js';
import { throwIfMissing } from '../utils/validators.js';
import { protectDataObservable } from './protectDataObservable.js';
import {
  Address,
  DataSchema,
  IExecConsumer,
  ProtectDataMessage,
  ProtectDataParams,
  ProtectedDataWithSecretProps,
} from './types.js';

export const protectData = ({
  iexec = throwIfMissing(),
  data,
  name = DEFAULT_DATA_NAME,
  ipfsNode = DEFAULT_IEXEC_IPFS_NODE,
  ipfsGateway = DEFAULT_IPFS_GATEWAY,
}: IExecConsumer &
  ProtectDataParams): Promise<ProtectedDataWithSecretProps> => {
  // leave inputs unchecked as they are validated by protectDataObservable
  let address: Address;
  let owner: Address;
  let schema: DataSchema;
  let creationTimestamp: number;
  let transactionHash: string;
  let encryptionKey: string;
  let zipFile: Uint8Array;

  return new Promise((resolve, reject) => {
    try {
      protectDataObservable({
        iexec,
        data,
        name,
        ipfsNode,
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
            case 'PROTECTED_DATA_DEPLOYMENT_SUCCESS':
              address = data.address;
              owner = data.owner;
              creationTimestamp = data.creationTimestamp;
              transactionHash = data.txHash;
              break;
            default:
          }
        },
        (e: Error) => reject(e),
        () =>
          resolve({
            name,
            address,
            owner,
            schema,
            creationTimestamp,
            transactionHash,
            zipFile,
            encryptionKey,
          })
      );
    } catch (e) {
      reject(e);
    }
  });
};
