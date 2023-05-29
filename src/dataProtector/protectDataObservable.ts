import { multiaddr as Multiaddr } from '@multiformats/multiaddr';
import { ethers } from 'ethers';
import {
  CONTRACT_ADDRESS,
  DEFAULT_DATA_NAME,
  DEFAULT_IEXEC_IPFS_NODE,
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
import { getLogger } from '../utils/logger.js';
import { Observable, SafeObserver } from '../utils/reactive.js';
import {
  stringSchema,
  throwIfMissing,
  urlSchema,
} from '../utils/validators.js';
import {
  DataObject,
  IExecConsumer,
  ProtectDataMessage,
  ProtectDataParams,
} from './types.js';

const logger = getLogger('protectDataObservable');

export const protectDataObservable = ({
  iexec = throwIfMissing(),
  data,
  name = DEFAULT_DATA_NAME,
  ipfsNodeMultiaddr = DEFAULT_IEXEC_IPFS_NODE,
  ipfsGateway = DEFAULT_IPFS_GATEWAY,
}: IExecConsumer & ProtectDataParams): Observable<ProtectDataMessage> => {
  const vName = stringSchema().label('name').validateSync(name);
  const vIpfsNodeMultiaddr = stringSchema()
    .label('ipfsNodeMultiaddr')
    .validateSync(ipfsNodeMultiaddr);
  const vIpfsGateway = urlSchema()
    .label('ipfsGateway')
    .validateSync(ipfsGateway);
  let vData: DataObject;
  try {
    ensureDataObjectIsValid(data);
    vData = data;
  } catch (e: any) {
    throw new ValidationError(`data is not valid: ${e.message}`);
  }

  const observable = new Observable<ProtectDataMessage>((observer) => {
    let abort = false;
    const safeObserver: SafeObserver<ProtectDataMessage> = new SafeObserver(
      observer
    );
    const start = async () => {
      try {
        if (abort) return;
        const schema = await extractDataSchema(vData).catch((e: Error) => {
          throw new WorkflowError('Failed to extract data schema', e);
        });

        safeObserver.next({
          message: 'DATA_SCHEMA_EXTRACTED',
          schema,
        });
        if (abort) return;
        let file;
        await createZipFromObject(vData)
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
        });
        if (abort) return;
        const cid = await add(encryptedFile, {
          ipfsNodeMultiaddr: vIpfsNodeMultiaddr,
          ipfsGateway: vIpfsGateway,
        }).catch((e: Error) => {
          throw new WorkflowError('Failed to upload encrypted data', e);
        });
        if (abort) return;
        const multiaddr = `/ipfs/${cid}`;
        safeObserver.next({
          message: 'ENCRYPTED_FILE_UPLOADED',
          cid,
        });

        const { provider, signer } =
          await iexec.config.resolveContractsClient();

        const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
        const multiaddrBytes = Multiaddr(multiaddr).bytes;
        const ownerAddress = await signer.getAddress();

        if (abort) return;
        safeObserver.next({
          message: 'PROTECTED_DATA_DEPLOYMENT_REQUEST',
          owner: ownerAddress,
          name: vName,
          schema,
        });
        const transaction = await contract
          .connect(signer)
          .createDatasetWithSchema(
            ownerAddress,
            vName,
            JSON.stringify(schema),
            multiaddrBytes,
            checksum
          );
        const transactionReceipt = await transaction.wait();
        const protectedDataAddress = transactionReceipt.events[1].args[0];
        const txHash = transactionReceipt.transactionHash;
        const block = await provider.getBlock(transactionReceipt.blockNumber);
        const creationTimestamp = block.timestamp;

        if (abort) return;
        safeObserver.next({
          message: 'PROTECTED_DATA_DEPLOYMENT_SUCCESS',
          address: protectedDataAddress,
          owner: ownerAddress,
          creationTimestamp,
          txHash,
        });
        // share secret with scone SMS
        safeObserver.next({
          message: 'PUSH_SECRET_TO_SMS_REQUEST',
          teeFramework: 'scone',
        });
        await iexec.dataset
          .pushDatasetSecret(protectedDataAddress, encryptionKey, {
            teeFramework: 'scone',
          })
          .catch((e: Error) => {
            throw new WorkflowError(
              'Failed to push protected data encryption key',
              e
            );
          });
        if (abort) return;
        safeObserver.next({
          message: 'PUSH_SECRET_TO_SMS_SUCCESS',
          teeFramework: 'scone',
        });
        // share secret with gramine SMS
        safeObserver.next({
          message: 'PUSH_SECRET_TO_SMS_REQUEST',
          teeFramework: 'gramine',
        });
        await iexec.dataset
          .pushDatasetSecret(protectedDataAddress, encryptionKey, {
            teeFramework: 'gramine',
          })
          .catch((e: Error) => {
            throw new WorkflowError(
              'Failed to push protected data encryption key',
              e
            );
          });
        if (abort) return;
        safeObserver.next({
          message: 'PUSH_SECRET_TO_SMS_SUCCESS',
          teeFramework: 'gramine',
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
