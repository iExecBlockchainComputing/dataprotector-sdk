import {
  DEFAULT_IEXEC_IPFS_NODE_MULTIADDR,
  DEFAULT_IPFS_GATEWAY,
} from '../config';
import { throwIfMissing } from '../utils/validators';
import { protectDataObservable } from './protectDataObservable';
import { IExecConsumer, ProtectDataParams } from './types';

export const protectData = ({
  iexec = throwIfMissing(),
  data = throwIfMissing(),
  name = throwIfMissing(),
  ipfsNodeMultiaddr = DEFAULT_IEXEC_IPFS_NODE_MULTIADDR,
  ipfsGateway = DEFAULT_IPFS_GATEWAY,
}: IExecConsumer & ProtectDataParams): Promise<any> => {
  let dataAddress;
  let encryptionKey;
  let ipfsMultiaddr;
  let dataSchema;
  let zipFile;
  const promise = new Promise((resolve, reject) => {
    protectDataObservable({
      iexec,
      data,
      name,
      ipfsNodeMultiaddr,
      ipfsGateway,
    }).subscribe(
      (data) => {
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
            ipfsMultiaddr = data.multiaddr;
            break;
          case 'PROTECTED_DATA_DEPLOYMENT_SUCCESS':
            dataAddress = data.dataAddress;
            break;
          default:
        }
      },
      (e) => reject(e),
      () =>
        resolve({
          dataSchema,
          zipFile,
          dataAddress,
          encryptionKey,
          ipfsMultiaddr,
        })
    );
  });

  return promise;
};
