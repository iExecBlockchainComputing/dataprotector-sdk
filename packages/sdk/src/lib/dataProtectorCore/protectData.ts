import { multiaddr as Multiaddr } from '@multiformats/multiaddr';
import {
  DEFAULT_ARWEAVE_GATEWAY,
  DEFAULT_DATA_NAME,
} from '../../config/config.js';
import * as arweave from '../../services/arweave.js';
import * as ipfs from '../../services/ipfs.js';
import {
  createZipFromObject,
  ensureDataObjectIsValid,
  extractDataSchema,
} from '../../utils/data.js';
import {
  ValidationError,
  handleIfProtocolError,
  WorkflowError,
} from '../../utils/errors.js';
import { getEventFromLogs } from '../../utils/getEventFromLogs.js';
import { getLogger } from '../../utils/logger.js';
import {
  stringSchema,
  throwIfMissing,
  urlSchema,
  validateOnStatusUpdateCallback,
} from '../../utils/validators.js';
import {
  DataObject,
  IpfsNodeAndGateway,
  OnStatusUpdateFn,
  ProtectDataParams,
  ProtectDataStatuses,
  ProtectedDataWithSecretProps,
} from '../types/index.js';
import {
  ArweaveUploadConsumer,
  DataProtectorContractConsumer,
  IExecConsumer,
  IExecDebugConsumer,
} from '../types/internalTypes.js';
import { getDataProtectorCoreContract } from './smartContract/getDataProtectorCoreContract.js';

const logger = getLogger('protectData');

export type ProtectData = typeof protectData;

export const protectData = async ({
  iexec = throwIfMissing(),
  iexecDebug = throwIfMissing(),
  dataprotectorContractAddress,
  name = DEFAULT_DATA_NAME,
  uploadMode = 'ipfs',
  ipfsNode,
  ipfsGateway,
  arweaveUploadApi,
  allowDebug = false,
  data,
  onStatusUpdate = () => {},
}: IExecConsumer &
  IExecDebugConsumer &
  DataProtectorContractConsumer &
  IpfsNodeAndGateway &
  ArweaveUploadConsumer &
  ProtectDataParams): Promise<ProtectedDataWithSecretProps> => {
  const vName = stringSchema().label('name').validateSync(name);
  const vUploadMode = stringSchema()
    .oneOf(['ipfs', 'arweave'])
    .label('uploadMode')
    .validateSync(uploadMode);
  const vIpfsNodeUrl = urlSchema().label('ipfsNode').validateSync(ipfsNode);
  const vIpfsGateway = urlSchema()
    .label('ipfsGateway')
    .validateSync(ipfsGateway);
  const vOnStatusUpdate =
    validateOnStatusUpdateCallback<OnStatusUpdateFn<ProtectDataStatuses>>(
      onStatusUpdate
    );

  let vData: DataObject;
  try {
    ensureDataObjectIsValid(data);
    vData = data;
  } catch (e: any) {
    throw new ValidationError(`data is not valid: ${e.message}`);
  }

  try {
    vOnStatusUpdate({
      title: 'EXTRACT_DATA_SCHEMA',
      isDone: false,
    });
    const schema = await extractDataSchema(vData).catch((e: Error) => {
      throw new WorkflowError({
        message: 'Failed to extract data schema',
        errorCause: e,
      });
    });
    vOnStatusUpdate({
      title: 'EXTRACT_DATA_SCHEMA',
      isDone: true,
    });

    vOnStatusUpdate({
      title: 'CREATE_ZIP_FILE',
      isDone: false,
    });
    let file;
    await createZipFromObject(vData)
      .then((zipFile: Uint8Array) => {
        file = zipFile;
      })
      .catch((e: Error) => {
        throw new WorkflowError({
          message: 'Failed to serialize data object',
          errorCause: e,
        });
      });
    vOnStatusUpdate({
      title: 'CREATE_ZIP_FILE',
      isDone: true,
    });

    vOnStatusUpdate({
      title: 'CREATE_ENCRYPTION_KEY',
      isDone: false,
    });
    const encryptionKey = iexec.dataset.generateEncryptionKey();
    vOnStatusUpdate({
      title: 'CREATE_ENCRYPTION_KEY',
      isDone: true,
      payload: {
        encryptionKey,
      },
    });

    vOnStatusUpdate({
      title: 'ENCRYPT_FILE',
      isDone: false,
    });
    const encryptedFile = await iexec.dataset
      .encrypt(file, encryptionKey)
      .catch((e: Error) => {
        throw new WorkflowError({
          message: 'Failed to encrypt data',
          errorCause: e,
        });
      });
    const checksum = await iexec.dataset
      .computeEncryptedFileChecksum(encryptedFile)
      .catch((e: Error) => {
        throw new WorkflowError({
          message: 'Failed to compute encrypted data checksum',
          errorCause: e,
        });
      });
    vOnStatusUpdate({
      title: 'ENCRYPT_FILE',
      isDone: true,
    });

    vOnStatusUpdate({
      title: 'UPLOAD_ENCRYPTED_FILE',
      isDone: false,
    });

    let multiaddr: string;
    let multiaddrBytes: Uint8Array;

    if (vUploadMode === 'arweave') {
      const arweaveId = await arweave
        .add(encryptedFile, { arweaveUploadApi })
        .catch((e: Error) => {
          throw new WorkflowError({
            message: 'Failed to upload encrypted data',
            errorCause: e,
          });
        });
      multiaddr = `${DEFAULT_ARWEAVE_GATEWAY}/${arweaveId}`;
      multiaddrBytes = new TextEncoder().encode(multiaddr);
      vOnStatusUpdate({
        title: 'UPLOAD_ENCRYPTED_FILE',
        isDone: true,
        payload: {
          arweaveId,
        },
      });
    } else {
      // ipfs fallback
      const cid = await ipfs
        .add(encryptedFile, {
          ipfsNode: vIpfsNodeUrl,
          ipfsGateway: vIpfsGateway,
        })
        .catch((e: Error) => {
          throw new WorkflowError({
            message: 'Failed to upload encrypted data',
            errorCause: e,
          });
        });
      multiaddr = `/p2p/${cid}`;
      multiaddrBytes = Multiaddr(multiaddr).bytes;
      vOnStatusUpdate({
        title: 'UPLOAD_ENCRYPTED_FILE',
        isDone: true,
        payload: {
          cid,
        },
      });
    }

    const { provider, signer, txOptions } =
      await iexec.config.resolveContractsClient();

    const ownerAddress = await signer.getAddress();

    vOnStatusUpdate({
      title: 'DEPLOY_PROTECTED_DATA',
      isDone: false,
    });
    const dataProtectorContract = await getDataProtectorCoreContract(
      iexec,
      dataprotectorContractAddress
    );
    const transactionReceipt = await dataProtectorContract
      .createDatasetWithSchema(
        ownerAddress,
        vName,
        JSON.stringify(schema),
        multiaddrBytes,
        checksum,
        txOptions
      )
      .then((tx) => tx.wait())
      .catch((e: Error) => {
        throw new WorkflowError({
          message: 'Failed to create protected data into smart contract',
          errorCause: e,
        });
      });

    const specificEventForPreviousTx = getEventFromLogs({
      contract: dataProtectorContract,
      eventName: 'DatasetSchema',
      logs: transactionReceipt.logs,
    });
    const protectedDataAddress = specificEventForPreviousTx.args?.dataset;

    const txHash = transactionReceipt.hash;
    const block = await provider.getBlock(transactionReceipt.blockNumber);
    const creationTimestamp = block.timestamp;

    vOnStatusUpdate({
      title: 'DEPLOY_PROTECTED_DATA',
      isDone: true,
      payload: {
        address: protectedDataAddress,
        explorerUrl: `https://explorer.iex.ec/bellecour/dataset/${protectedDataAddress}`,
        owner: ownerAddress,
        creationTimestamp: String(creationTimestamp),
        txHash,
      },
    });

    // share secret with scone SMS
    vOnStatusUpdate({
      title: 'PUSH_SECRET_TO_SMS',
      isDone: false,
      payload: {
        teeFramework: 'scone',
      },
    });
    await iexec.dataset
      .pushDatasetSecret(protectedDataAddress, encryptionKey, {
        teeFramework: 'scone',
      })
      .catch((e: Error) => {
        handleIfProtocolError(e);
        throw new WorkflowError({
          message: 'Failed to push protected data encryption key',
          errorCause: e,
        });
      });
    vOnStatusUpdate({
      title: 'PUSH_SECRET_TO_SMS',
      isDone: true,
      payload: {
        teeFramework: 'scone',
      },
    });

    if (allowDebug === true) {
      // share secret with scone debug SMS
      vOnStatusUpdate({
        title: 'PUSH_SECRET_TO_DEBUG_SMS',
        isDone: false,
        payload: {
          teeFramework: 'scone',
        },
      });
      await iexecDebug.dataset
        .pushDatasetSecret(protectedDataAddress, encryptionKey, {
          teeFramework: 'scone',
        })
        .catch((e: Error) => {
          handleIfProtocolError(e);
          throw new WorkflowError({
            message: 'Failed to push protected data encryption key',
            errorCause: e,
          });
        });
      vOnStatusUpdate({
        title: 'PUSH_SECRET_TO_DEBUG_SMS',
        isDone: true,
        payload: {
          teeFramework: 'scone',
        },
      });
    }

    return {
      name,
      address: protectedDataAddress,
      owner: ownerAddress,
      schema,
      creationTimestamp,
      transactionHash: txHash,
      zipFile: file,
      encryptionKey,
      multiaddr,
    };
  } catch (e: any) {
    logger.log(e);
    handleIfProtocolError(e);
    throw e;
  }
};
