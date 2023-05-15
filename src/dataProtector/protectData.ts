import {
  DataSchema,
  IExecConsumer,
  ProtectDataParams,
  ProtectDataMessage,
  ProtectedDataWithSecretProps,
  Address,
} from './types.js';
import {
  DEFAULT_IEXEC_IPFS_NODE,
  DEFAULT_IPFS_GATEWAY,
} from '../config/config.js';
import { throwIfMissing } from '../utils/validators.js';
import { protectDataObservable } from './protectDataObservable.js';

export const protectData = ({
  iexec = throwIfMissing(),
  data,
  name,
  ipfsNodeMultiaddr = DEFAULT_IEXEC_IPFS_NODE,
  ipfsGateway = DEFAULT_IPFS_GATEWAY,
}: IExecConsumer &
  ProtectDataParams): Promise<ProtectedDataWithSecretProps> => {
  // leave inputs unchecked as they are validated by protectDataObservable
  let address: Address;
  let owner: Address;
  let schema: DataSchema;
  let creationTimestamp: number;
  let checksum: string;
  let blockNumber: number;
  let multiaddr: string;
  let transactionHash: string;
  let encryptionKey: string;
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
            case 'PROTECTED_DATA_DEPLOYMENT_REQUEST':
              checksum = data.checksum;
              break;
            case 'PROTECTED_DATA_DEPLOYMENT_SUCCESS':
              address = data.address;
              owner = data.owner;
              creationTimestamp = data.creationTimestamp;
              blockNumber = data.blockNumber;
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
            checksum,
            blockNumber,
            multiaddr,
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
