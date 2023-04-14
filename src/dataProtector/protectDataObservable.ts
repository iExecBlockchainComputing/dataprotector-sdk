import {
  DEFAULT_IEXEC_IPFS_NODE_MULTIADDR,
  CONTRACT_ADDRESS,
  DEFAULT_IPFS_GATEWAY,
} from '../config';
import { WorkflowError } from '../utils/errors';
import { add } from '../services/ipfs';
import { throwIfMissing } from '../utils/validators';
import { ProtectDataOptions } from './types';
import { ethers } from 'ethers';
import { ABI } from '../contracts/abi';
import { Observable, SafeObserver } from '../utils/reactive';
import { createZipFromObject, extractDataSchema } from '../utils/data';

const protectDataObservable = ({
  iexec = throwIfMissing(),
  object = throwIfMissing(),
  ethersProvider = throwIfMissing(),
  ipfsNodeMultiaddr = DEFAULT_IEXEC_IPFS_NODE_MULTIADDR,
  ipfsGateway = DEFAULT_IPFS_GATEWAY,
}: ProtectDataOptions): Observable => {
  console.log('object', object);
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

        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          ABI,
          ethersProvider
        );
        const signer = ethersProvider.getSigner();
        const ipfsmultiaddrBytes = ethers.utils.toUtf8Bytes(multiaddr);
        const address = await signer.getAddress();
        const transaction = await contract
          .connect(signer)
          .createDatasetWithSchema(
            address,
            object.name,
            dataSchema,
            ipfsmultiaddrBytes,
            checksum
          );
        const transactionReceipt = await transaction.wait();
        console.log(transactionReceipt);
        const dataAddress = transactionReceipt.events[1].args[0];
        const txHash = transactionReceipt.transactionHash;

        if (abort) return;
        safeObserver.next({
          message: 'PROTECTED_DATA_DEPLOYMENT_SUCCESS',
          dataAddress,
          txHash,
        });

        safeObserver.next({
          message: 'PUSH_SECRET_TO_SMS_SIGN_REQUEST',
        });
        await iexec.dataset
          .pushDatasetSecret(dataAddress, encryptionKey)
          .catch((e: any) => {
            throw new WorkflowError(
              'Failed to push protected data encryption key',
              e
            );
          });
        if (abort) return;
        safeObserver.next({
          message: 'PUSH_SECRET_TO_SMS_SUCCESS',
        });
        const Ipfsmultiaddr = multiaddr;
        safeObserver.next({ dataAddress, encryptionKey, Ipfsmultiaddr });
        safeObserver.complete();
      } catch (e: any) {
        console.log(e);
        if (abort) return;
        if (e instanceof WorkflowError) {
          safeObserver.error(e);
        } else {
          safeObserver.error(
            new WorkflowError('Protect data unexpected error', e)
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
export { protectDataObservable };
