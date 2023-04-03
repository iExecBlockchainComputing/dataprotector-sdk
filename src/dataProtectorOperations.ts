import { Buffer } from 'buffer';
import { IExec } from 'iexec';
import { DEFAULT_IEXEC_IPFS_NODE_MULTIADDR } from './conf';
import { WorkflowError } from './errors';
import { add } from './ipfs-service';
import { Observable, SafeObserver } from './reactive';
import { throwIfMissing } from './validators';

const protectData = ({
  iexec = throwIfMissing(),
  data = throwIfMissing(),
  name = throwIfMissing(),
  ipfsNodeMultiaddr = DEFAULT_IEXEC_IPFS_NODE_MULTIADDR,
}: {
  iexec: any;
  data: string | ArrayBuffer | Uint8Array | Buffer;
  name: string;
  ipfsNodeMultiaddr?: string;
}): Promise<any> =>
  new Promise(function (resolve, reject) {
    const start = async () => {
      try {
        const encryptionKey = iexec.dataset.generateEncryptionKey();
        let confidentialNFTdata = data;
        if (typeof data === 'string') {
          confidentialNFTdata = Buffer.from(data, 'utf8');
        }
        const encryptedFile = await iexec.dataset
          .encrypt(confidentialNFTdata, encryptionKey)
          .catch((e) => {
            throw new WorkflowError('Failed to encrypt data', e);
          });
        const checksum = await iexec.dataset
          .computeEncryptedFileChecksum(encryptedFile)
          .catch((e) => {
            throw new WorkflowError(
              'Failed to compute encrypted data checksum',
              e
            );
          });

        const cid = await add(encryptedFile, { ipfsNodeMultiaddr }).catch(
          (e) => {
            throw new WorkflowError('Failed to upload encrypted data', e);
          }
        );
        const multiaddr = `/ipfs/${cid}`;
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

        await iexec.dataset
          .pushDatasetSecret(address, encryptionKey)
          .catch((e: any) => {
            throw new WorkflowError(
              'Failed to push API confidential NFT encryption key',
              e
            );
          });
        const cNFTAddress = address;
        const Ipfsmultiaddr = multiaddr;
        resolve({ cNFTAddress, encryptionKey, Ipfsmultiaddr });
      } catch (e: any) {
        if (e instanceof WorkflowError) {
          reject(e);
        } else {
          reject(new WorkflowError('CNFT creation unexpected error', e));
        }
      }
    };

    start();
  });

const protectDataObservable = ({
  iexec = throwIfMissing(),
  data = throwIfMissing(),
  name = throwIfMissing(),
  ipfsNodeMultiaddr = DEFAULT_IEXEC_IPFS_NODE_MULTIADDR,
}: {
  iexec: any;
  data: string | ArrayBuffer | Uint8Array | Buffer;
  name: string;
  ipfsNodeMultiaddr?: string;
}): Observable => {
  const observable = new Observable((observer) => {
    let abort = false;
    const safeObserver = new SafeObserver(observer);
    const start = async () => {
      try {
        if (abort) return;

        const encryptionKey = iexec.dataset.generateEncryptionKey();
        safeObserver.next({
          message: 'ENCRYPTION_KEY_CREATED',
          encryptionKey,
        });
        let confidentialNFTdata = data;
        if (typeof data === 'string') {
          confidentialNFTdata = Buffer.from(data, 'utf8');
        }
        if (abort) return;
        const encryptedFile = await iexec.dataset
          .encrypt(confidentialNFTdata, encryptionKey)
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
        const cid = await add(encryptedFile, { ipfsNodeMultiaddr }).catch(
          (e) => {
            throw new WorkflowError('Failed to upload encrypted data', e);
          }
        );
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
        safeObserver.next({ cNFTAddress, encryptionKey, Ipfsmultiaddr });
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

const grantAccess = ({
  iexec = throwIfMissing(),
  dataset = throwIfMissing(),
  datasetprice,
  volume,
  tag,
  apprestrict,
  workerpoolrestrict,
  requesterrestrict,
}: {
  iexec: IExec;
  dataset: string;
  datasetprice?: number;
  volume?: number;
  tag?: string;
  apprestrict?: string;
  workerpoolrestrict?: string;
  requesterrestrict?: string;
}): Promise<string> =>
  new Promise(function (resolve, reject) {
    const start = async () => {
      try {
        const orderTemplate = await iexec.order
          .createDatasetorder({
            dataset,
            datasetprice,
            volume,
            tag,
            apprestrict,
            workerpoolrestrict,
            requesterrestrict,
          })
          .catch((e) => {
            throw new WorkflowError('Failed to create dataset order', e);
          });

        const signedOrder = await iexec.order
          .signDatasetorder(orderTemplate)
          .catch((e) => {
            throw new WorkflowError('Failed to sign dataset order', e);
          });
        console.log('Signed order', signedOrder);

        const orderHash = await iexec.order
          .publishDatasetorder(signedOrder)
          .catch((e) => {
            throw new WorkflowError('Failed to publish dataset order', e);
          });
        console.log(`Order published with hash ${orderHash}`);
        resolve(orderHash);
      } catch (e: any) {
        if (e instanceof WorkflowError) {
          reject(e);
        } else {
          reject(new WorkflowError('Order publish unexpected error', e));
        }
      }
    };
    start();
  });

const revokeAccess = ({
  iexec = throwIfMissing(),
  dataset = throwIfMissing(),
  appAddress = throwIfMissing(),
}: {
  iexec: IExec;
  dataset: string;
  appAddress: string;
}): Promise<string> =>
  new Promise(function (resolve, reject) {
    const start = async () => {
      try {
        const publishedDatasetorders = await iexec.orderbook
          .fetchDatasetOrderbook(dataset)
          .catch((e) => {
            throw new WorkflowError('Failed to fetch dataset orderbook', e);
          });

        const order = publishedDatasetorders.orders.find(
          (datasetorder) => datasetorder.order.apprestrict === appAddress
        ).order;

        const { txHash } = await iexec.order.cancelDatasetorder(order);
        console.log(`Order canceled (tx:${txHash})`);
        resolve(txHash);
      } catch (e: any) {
        if (e instanceof WorkflowError) {
          reject(e);
        } else {
          reject(new WorkflowError('Order publish unexpected error', e));
        }
      }
    };
    start();
  });

export { protectData, protectDataObservable, grantAccess, revokeAccess };
