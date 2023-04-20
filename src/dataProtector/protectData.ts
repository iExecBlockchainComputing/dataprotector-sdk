import {
  DEFAULT_IEXEC_IPFS_NODE_MULTIADDR,
  DEFAULT_IPFS_GATEWAY,
} from '../config';
import { throwIfMissing } from '../utils/validators';
import { protectDataObservable } from './protectDataObservable';
import { IExecConsumer, ProtectDataOptions } from './types';

export const protectData = ({
  iexec = throwIfMissing(),
  object = throwIfMissing(),
  ethersProvider = throwIfMissing(),
  ipfsNodeMultiaddr = DEFAULT_IEXEC_IPFS_NODE_MULTIADDR,
  ipfsGateway = DEFAULT_IPFS_GATEWAY,
}: IExecConsumer & ProtectDataOptions): Promise<any> => {
  let dataAddress;
  let encryptionKey;
  let Ipfsmultiaddr;
  let dataSchema;
  let zipFile;
  const promise = new Promise((resolve, reject) => {
    protectDataObservable({
      iexec,
      object,
      ethersProvider,
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
            Ipfsmultiaddr = data.multiaddr;
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
          Ipfsmultiaddr,
        })
    );
  });

  return promise;
};
