import { ethers } from 'ethers';
import {
  CONTRACT_ADDRESS,
  DEFAULT_IEXEC_IPFS_NODE_MULTIADDR,
  DEFAULT_IPFS_GATEWAY,
} from '../config';
import { ABI } from '../contracts/abi';
import { add } from '../services/ipfs';
import { createZipFromObject, extractDataSchema } from '../utils/data';
import { WorkflowError } from '../utils/errors';
import { Observable, SafeObserver } from '../utils/reactive';
import { throwIfMissing } from '../utils/validators';
import { ProtectDataParams, IExecConsumer } from './types';
import { getLogger } from '../utils/logger';

const logger = getLogger('protectDataObservable');

const protectDataObservable = ({
  iexec = throwIfMissing(),
  data = throwIfMissing(),
  name = throwIfMissing(),
  ipfsNodeMultiaddr = DEFAULT_IEXEC_IPFS_NODE_MULTIADDR,
  ipfsGateway = DEFAULT_IPFS_GATEWAY,
}: IExecConsumer & ProtectDataParams): Observable => {
  const observable = new Observable((observer) => {
    let abort = false;
    const safeObserver = new SafeObserver(observer);
    const start = async () => {
      try {
        if (abort) return;
        const dataSchema = await extractDataSchema(
          data as Record<string, unknown>
        ).catch((e) => logger.log(e));
        safeObserver.next({
          message: 'DATA_SCHEMA_EXTRACTED',
          dataSchema,
        });
        if (abort) return;
        let file;
        await createZipFromObject(data)
          .then((zipFile: Uint8Array) => {
            file = zipFile;
            safeObserver.next({
              message: 'ZIP_FILE_CREATED',
              zipFile,
            });
          })
          .catch((error) => {
            logger.log(error);
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

        const { provider, signer } =
          await iexec.config.resolveContractsClient();

        const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
        const ipfsMultiaddrBytes = ethers.utils.toUtf8Bytes(multiaddr);
        const address = await signer.getAddress();
        const transaction = await contract
          .connect(signer)
          .createDatasetWithSchema(
            address,
            name,
            dataSchema,
            ipfsMultiaddrBytes,
            checksum
          );
        const transactionReceipt = await transaction.wait();
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
        const ipfsMultiaddr = multiaddr;
        safeObserver.next({ dataAddress, encryptionKey, ipfsMultiaddr });
        safeObserver.complete();
      } catch (e: any) {
        logger.log(e);
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
