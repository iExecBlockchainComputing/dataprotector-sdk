import { DEFAULT_DATA_NAME } from '../config/config.js';
import { throwIfMissing } from '../utils/validators.js';
import { protectDataObservable } from './protectDataObservable.js';
import {
  Address,
  AddressOrENSConsumer,
  DataSchema,
  IExecConsumer,
  ProtectDataMessage,
  ProtectDataParams,
  ProtectedDataWithSecretProps,
} from './types.js';

export const protectData = ({
  iexec = throwIfMissing(),
  contractAddress,
  data,
  name = DEFAULT_DATA_NAME,
  ipfsNode,
  ipfsGateway,
}: IExecConsumer &
  AddressOrENSConsumer &
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
        contractAddress,
        data,
        name,
        ipfsNode,
        ipfsGateway,
      }).subscribe(
        (messageData: ProtectDataMessage) => {
          const { message } = messageData;
          switch (message) {
            case 'DATA_SCHEMA_EXTRACTED':
              schema = messageData.schema;
              break;
            case 'ZIP_FILE_CREATED':
              zipFile = messageData.zipFile;
              break;
            case 'ENCRYPTION_KEY_CREATED':
              encryptionKey = messageData.encryptionKey;
              break;
            case 'PROTECTED_DATA_DEPLOYMENT_SUCCESS':
              address = messageData.address;
              owner = messageData.owner;
              creationTimestamp = messageData.creationTimestamp;
              transactionHash = messageData.txHash;
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
