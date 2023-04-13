import {
  DEFAULT_IEXEC_IPFS_NODE_MULTIADDR,
  DEFAULT_IPFS_GATEWAY,
} from './conf';
import { WorkflowError } from './errors';
import { add } from './ipfs-service';
import { Observable, SafeObserver } from './reactive';
import { createZipFromObject, extractDataSchema } from './utils';
import { throwIfMissing } from './validators';

const protectData = ({
  iexec = throwIfMissing(),
  object = throwIfMissing(),
  ipfsNodeMultiaddr = DEFAULT_IEXEC_IPFS_NODE_MULTIADDR,
  ipfsGateway = DEFAULT_IPFS_GATEWAY,
}: {
  iexec: any;
  object: Record<string, unknown>;
  ipfsNodeMultiaddr?: string;
  ipfsGateway?: string;
}): Observable => {
  const observable = new Observable((observer) => {
    let abort = false;
    const safeObserver = new SafeObserver(observer);
    const start = async () => {
      try {
        if (abort) return;
        const dataSchema = await extractDataSchema(
          object.value as Record<string, unknown>
        ).catch((e) => console.log(e));
        safeObserver.next({
          message: 'DATA_SCHEMA_EXTRACTED',
          dataSchema,
        });
        if (abort) return;
        let file;
        await createZipFromObject(object.value)
          .then((zipFile: Uint8Array) => {
            file = zipFile;
            safeObserver.next({
              message: 'ZIP_FILE_CREATED',
              zipFile,
            });
          })
          .catch((error) => {
            console.log(error);
          });

        if (abort) return;

        const encryptionKey = iexec.dataset.generateEncryptionKey();
        safeObserver.next({
          message: 'ENCRYPTION_KEY_CREATED',
          encryptionKey,
        });
        if (abort) return;
        const encryptedFile = await iexec.dataset
          .encrypt(file, encryptionKey)
          .catch((e) => {
            throw new WorkflowError('Failed to encrypt data', e);
          });
        if (abort) return;
        const checksum = await iexec.dataset
          .computeEncryptedFileChecksum(encryptedFile)
          .catch((e) => {
            throw new WorkflowError(
              'Failed to compute encrypted data checksum',
              e
            );
          });
        if (abort) return;
        safeObserver.next({
          message: 'FILE_ENCRYPTED',
          encryptedFile,
          checksum,
        });
        if (abort) return;
        const cid = await add(encryptedFile, {
          ipfsNodeMultiaddr,
          ipfsGateway,
        }).catch((e) => {
          throw new WorkflowError('Failed to upload encrypted data', e);
        });
        if (abort) return;
        const multiaddr = `/ipfs/${cid}`;
        safeObserver.next({
          message: 'ENCRYPTED_FILE_UPLOADED',
          cid,
          multiaddr,
        });

        //TODO interract with the Smart contract
        /* 
        if (abort) return;
        safeObserver.next({
          message: 'CONFIDENTIAL_NFT_DEPLOYMENT_SUCCESS',
          address,
          txHash,
        });

        safeObserver.next({
          message: 'PUSH_SECRET_TO_SMS_SIGN_REQUEST',
        });
        await iexec.dataset
          .pushDatasetSecret(address, encryptionKey)
          .catch((e: any) => {
            throw new WorkflowError(
              'Failed to push API confidential NFT encryption key',
              e
            );
          });
        if (abort) return;
        safeObserver.next({
          message: 'PUSH_SECRET_TO_SMS_SUCCESS',
        });
        const cNFTAddress = address;
        const Ipfsmultiaddr = multiaddr;
        safeObserver.next({ cNFTAddress, encryptionKey, Ipfsmultiaddr }); */
        safeObserver.complete();
      } catch (e: any) {
        if (abort) return;
        if (e instanceof WorkflowError) {
          safeObserver.error(e);
        } else {
          safeObserver.error(
            new WorkflowError('CNFT creation unexpected error', e)
          );
        }
      }
    };

    safeObserver.unsub = () => {
      // teardown callback
      abort = true;
    };

    start();

    return safeObserver.unsubscribe.bind(safeObserver);
  });

  return observable;
};
export { protectData };
