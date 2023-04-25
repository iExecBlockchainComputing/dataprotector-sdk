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
import { ProtectDataParams, IExecConsumer, Address, DataSchema } from './types';
import { getLogger } from '../utils/logger';

const logger = getLogger('protectDataObservable');

type DataExtractedMessage = {
  message: 'DATA_SCHEMA_EXTRACTED';
  dataSchema: DataSchema;
};

type ZipCreatedMessage = {
  message: 'ZIP_FILE_CREATED';
  zipFile: Uint8Array;
};

type EncryptionKeyCreatedMessage = {
  message: 'ENCRYPTION_KEY_CREATED';
  encryptionKey: string;
};

type FileEncryptedMessage = {
  message: 'FILE_ENCRYPTED';
  encryptedFile: Uint8Array;
  checksum: string;
};

type EncryptedFileUploadedMessage = {
  message: 'ENCRYPTED_FILE_UPLOADED';
  cid: string;
  multiaddr: string;
};

type ProtectedDataDeploymentRequestMessage = {
  message: 'PROTECTED_DATA_DEPLOYMENT_REQUEST';
  owner: Address;
  name: string;
  dataSchema: string;
  multiaddr: string;
  checksum: string;
};

type ProtectedDataDeploymentSuccessMessage = {
  message: 'PROTECTED_DATA_DEPLOYMENT_SUCCESS';
  dataAddress: Address;
  txHash: string;
};

type PushSecretRequestMessage = {
  message: 'PUSH_SECRET_TO_SMS_SIGN_REQUEST';
};

type PushSecretSuccessMessage = {
  message: 'PUSH_SECRET_TO_SMS_SUCCESS';
};

export type ProtectDataMessage =
  | DataExtractedMessage
  | ZipCreatedMessage
  | EncryptionKeyCreatedMessage
  | FileEncryptedMessage
  | EncryptedFileUploadedMessage
  | ProtectedDataDeploymentRequestMessage
  | ProtectedDataDeploymentSuccessMessage
  | PushSecretRequestMessage
  | PushSecretSuccessMessage;

const protectDataObservable = ({
  iexec = throwIfMissing(),
  data = throwIfMissing(),
  name = throwIfMissing(),
  ipfsNodeMultiaddr = DEFAULT_IEXEC_IPFS_NODE_MULTIADDR,
  ipfsGateway = DEFAULT_IPFS_GATEWAY,
}: IExecConsumer & ProtectDataParams): Observable<ProtectDataMessage> => {
  const observable = new Observable((observer) => {
    let abort = false;
    const safeObserver: SafeObserver<ProtectDataMessage> = new SafeObserver(
      observer
    );
    const start = async () => {
      try {
        if (abort) return;
        const dataSchema = await extractDataSchema(data);
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
        const multiaddrBytes = ethers.utils.toUtf8Bytes(multiaddr);
        const ownerAddress = await signer.getAddress();
        const jsonDataSchema = JSON.stringify(dataSchema);

        if (abort) return;
        safeObserver.next({
          message: 'PROTECTED_DATA_DEPLOYMENT_REQUEST',
          owner: ownerAddress,
          name,
          dataSchema: jsonDataSchema,
          multiaddr,
          checksum,
        });
        const transaction = await contract
          .connect(signer)
          .createDatasetWithSchema(
            ownerAddress,
            name,
            jsonDataSchema,
            multiaddrBytes,
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
