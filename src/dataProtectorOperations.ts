import { Buffer } from 'buffer';
import { DEFAULT_IEXEC_IPFS_NODE_MULTIADDR, NULL_ADDRESS } from './conf';
import { WorkflowError } from './errors';
import { add } from './ipfs-service';
import { Observable, SafeObserver } from './reactive';
import { throwIfMissing } from './validators';
import {
  IGrantOptions,
  IProtectDataOptions,
  IRevokeOptions,
} from './interfaces';

const protectData = ({
  iexec = throwIfMissing(),
  data = throwIfMissing(),
  name = throwIfMissing(),
  ipfsNodeMultiaddr = DEFAULT_IEXEC_IPFS_NODE_MULTIADDR,
}: IProtectDataOptions): Promise<any> =>
  new Promise(function (resolve, reject) {
    const start = async () => {
      console.log('start creatio ');
      try {
        const encryptionKey = iexec.dataset.generateEncryptionKey();

        if (typeof data === 'string') {
          data = Buffer.from(data, 'utf8');
        }
        console.log('data', data);
        const encryptedFile = await iexec.dataset
          .encrypt(data, encryptionKey)
          .catch((e) => {
            throw new WorkflowError('Failed to encrypt data', e);
          });
        console.log('encryptedFile', encryptedFile);
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
        console.log('address', address);
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
        console.log({ cNFTAddress, encryptionKey, Ipfsmultiaddr });
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
}: IProtectDataOptions): Observable => {
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

        if (typeof data === 'string') {
          data = Buffer.from(data, 'utf8');
        }
        if (abort) return;
        const encryptedFile = await iexec.dataset
          .encrypt(data, encryptionKey)
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
}: IGrantOptions): Promise<string> =>
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
        console.log('orderTemplate', orderTemplate);
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
  apprestrict = NULL_ADDRESS,
  workerpoolrestrict = NULL_ADDRESS,
  requesterrestrict = NULL_ADDRESS,
}: IRevokeOptions): Promise<string[]> =>
  new Promise(function (resolve, reject) {
    const start = async () => {
      try {
        console.log('dataset', dataset);
        console.log('apprestrict', apprestrict);
        console.log('workerpoolrestrict', workerpoolrestrict);
        console.log('requesterrestrict', requesterrestrict);
        const publishedDatasetorders = await iexec.orderbook
          .fetchDatasetOrderbook(dataset, {
            app: apprestrict,
            workerpool: workerpoolrestrict,
            requester: requesterrestrict,
          })
          .catch((e) => {
            throw new WorkflowError('Failed to fetch dataset orderbook', e);
          });
        const tab_tx = await Promise.all(
          publishedDatasetorders.orders.map(async (e) => {
            return (await iexec.order.cancelDatasetorder(e.order)).txHash;
          })
        );
        if (tab_tx.length == 0) {
          reject('No order to revoke');
        }
        resolve(tab_tx);
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
