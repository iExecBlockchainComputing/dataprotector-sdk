import {
  ProtectDataParams,
  ProtectDataMessage,
  IExecConsumer,
} from './types.js';
import { ethers } from 'ethers';
import {
  CONTRACT_ADDRESS,
  DEFAULT_IEXEC_IPFS_NODE_MULTIADDR,
  DEFAULT_IPFS_GATEWAY,
} from '../config/config.js';
import { ABI } from '../contracts/abi.js';
import { add } from '../services/ipfs.js';
import {
  createZipFromObject,
  ensureDataObjectIsValid,
  extractDataSchema,
} from '../utils/data.js';
import { ValidationError, WorkflowError } from '../utils/errors.js';
import { Observable, SafeObserver } from '../utils/reactive.js';
import { throwIfMissing } from '../utils/validators.js';
import { getLogger } from '../utils/logger.js';

const logger = getLogger('protectDataObservable');

export const protectDataObservable = ({
  iexec = throwIfMissing(),
  data,
  name = '',
  ipfsNodeMultiaddr = DEFAULT_IEXEC_IPFS_NODE_MULTIADDR,
  ipfsGateway = DEFAULT_IPFS_GATEWAY,
}: IExecConsumer & ProtectDataParams): Observable<ProtectDataMessage> => {
  try {
    ensureDataObjectIsValid(data);
  } catch (e: any) {
    throw new ValidationError(e.message);
  }
  const observable = new Observable((observer) => {
    let abort = false;
    const safeObserver: SafeObserver<ProtectDataMessage> = new SafeObserver(
      observer
    );
    const start = async () => {
      try {
        if (abort) return;
        const schema = await extractDataSchema(data).catch((e: Error) => {
          throw new WorkflowError('Failed to extract data schema', e);
        });

        safeObserver.next({
          message: 'DATA_SCHEMA_EXTRACTED',
          schema,
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
          .catch((e: Error) => {
            throw new WorkflowError('Failed to serialize data object', e);
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
          .catch((e: Error) => {
            throw new WorkflowError('Failed to encrypt data', e);
          });
        if (abort) return;
        const checksum = await iexec.dataset
          .computeEncryptedFileChecksum(encryptedFile)
          .catch((e: Error) => {
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
        }).catch((e: Error) => {
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
        const multiaddrBytes = ethers.utils.toUtf8Bytes(multiaddr);
        const ownerAddress = await signer.getAddress();

        if (abort) return;
        safeObserver.next({
          message: 'PROTECTED_DATA_DEPLOYMENT_REQUEST',
          owner: ownerAddress,
          name,
          schema,
          multiaddr,
          checksum,
        });
        const transaction = await contract
          .connect(signer)
          .createDatasetWithSchema(
            ownerAddress,
            name,
            JSON.stringify(schema),
            multiaddrBytes,
            checksum
          );
        const transactionReceipt = await transaction.wait();
        const protectedDataAddress = transactionReceipt.events[1].args[0];
        const txHash = transactionReceipt.transactionHash;

        if (abort) return;
        safeObserver.next({
          message: 'PROTECTED_DATA_DEPLOYMENT_SUCCESS',
          address: protectedDataAddress,
          owner: ownerAddress,
          txHash,
        });

        safeObserver.next({
          message: 'PUSH_SECRET_TO_SMS_REQUEST',
        });
        await iexec.dataset
          .pushDatasetSecret(protectedDataAddress, encryptionKey)
          .catch((e: Error) => {
            throw new WorkflowError(
              'Failed to push protected data encryption key',
              e
            );
          });
        if (abort) return;
        safeObserver.next({
          message: 'PUSH_SECRET_TO_SMS_SUCCESS',
        });
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
