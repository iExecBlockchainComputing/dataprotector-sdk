import { Buffer } from 'buffer';
import { DEFAULT_IPFS_GATEWAY } from './conf';
import { WorkflowError } from './errors';
import { add } from './ipfs-service';
import { Observable, SafeObserver } from './reactive';
import { throwIfMissing } from './validators';

const createCNFT = ({
  iexec = throwIfMissing(),
  data = throwIfMissing(),
  name = throwIfMissing(),
  ipfsGateway = DEFAULT_IPFS_GATEWAY,
}: {
  iexec: any;
  data: string | ArrayBuffer | Uint8Array | Buffer;
  name: string;
  ipfsGateway?: string;
}): Observable =>
  new Observable((observer) => {
    let abort = false;
    const safeObserver = new SafeObserver(observer);
    const start = async () => {
      try {
        if (abort) return;

        const key = iexec.dataset.generateEncryptionKey();
        safeObserver.next({
          message: 'ENCRYPTION_KEY_CREATED',
          key,
        });
        let confidentialNFTdata = data;
        if (typeof data === 'string') {
          confidentialNFTdata = Buffer.from(data, 'utf8');
        }
        const encryptedFile = await iexec.dataset
          .encrypt(confidentialNFTdata, key)
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

        const cid = await add(encryptedFile, { ipfsGateway }).catch((e) => {
          throw new WorkflowError('Failed to upload encrypted data', e);
        });
        if (abort) return;
        const multiaddr = `/ipfs/${cid}`;
        safeObserver.next({
          message: 'ENCRYPTED_FILE_UPLOADED',
          cid,
          multiaddr,
        });

        safeObserver.next({
          message: 'CONFIDENTIAL_NFT_DEPLOYMENT_SIGN_TX_REQUEST',
        });
        const { address, txHash } = await iexec.dataset
          .deployDataset({
            owner: await iexec.wallet.getAddress(),
            name: name,
            multiaddr,
            checksum,
          })
          .catch((e) => {
            throw new WorkflowError('Failed to deploy confidential NFT', e);
          });
        if (abort) return;
        safeObserver.next({
          message: 'CONFIDENTIAL_NFT_DEPLOYMENT_SUCCESS',
          address,
          txHash,
        });

        safeObserver.next({
          message: 'PUSH_SECRET_TO_SMS_SIGN_REQUEST',
        });
        await iexec.dataset.pushDatasetSecret(address, key).catch((e: any) => {
          throw new WorkflowError(
            'Failed to push API confidential NFT encryption key',
            e
          );
        });
        if (abort) return;
        safeObserver.next({
          message: 'PUSH_SECRET_TO_SMS_SUCCESS',
        });

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
export { createCNFT };
