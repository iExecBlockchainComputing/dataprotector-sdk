import { multiaddr as Multiaddr } from '@multiformats/multiaddr';
import { Contract, ethers } from 'ethers';
import { DEFAULT_DATA_NAME } from '../config/config.js';
import { ABI } from '../contracts/abi.js';
import { add } from '../services/ipfs.js';
import {
  createZipFromObject,
  ensureDataObjectIsValid,
  extractDataSchema,
} from '../utils/data.js';
import { ValidationError, WorkflowError } from '../utils/errors.js';
import { getLogger } from '../utils/logger.js';
import {
  stringSchema,
  throwIfMissing,
  urlSchema,
} from '../utils/validators.js';
import {
  AddressOrENSConsumer,
  DataObject,
  IExecConsumer,
  IpfsNodeAndGateway,
  ProtectDataParams,
  ProtectedDataWithSecretProps,
} from './types.js';

/**
 * TO REMOVE
 */

const logger = getLogger('protectData');

export const protectData = async ({
  iexec = throwIfMissing(),
  contractAddress,
  ipfsNode,
  ipfsGateway,
  data,
  name = DEFAULT_DATA_NAME,
  onStatusUpdate = () => {},
}: IExecConsumer &
  AddressOrENSConsumer &
  IpfsNodeAndGateway &
  ProtectDataParams): Promise<ProtectedDataWithSecretProps> => {
  const vName = stringSchema().label('name').validateSync(name);
  const vIpfsNodeUrl = urlSchema().label('ipfsNode').validateSync(ipfsNode);
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

  try {
    onStatusUpdate({
      title: 'EXTRACT_DATA_SCHEMA',
      isDone: false,
    });
    const schema = await extractDataSchema(vData).catch((e: Error) => {
      throw new WorkflowError('Failed to extract data schema', e);
    });
    onStatusUpdate({
      title: 'EXTRACT_DATA_SCHEMA',
      isDone: true,
      // payload: {
      //   schema
      // }
    });

    onStatusUpdate({
      title: 'CREATE_ZIP_FILE',
      isDone: false,
    });
    let file;
    await createZipFromObject(vData)
      .then((zipFile: Uint8Array) => {
        file = zipFile;
      })
      .catch((e: Error) => {
        throw new WorkflowError('Failed to serialize data object', e);
      });
    onStatusUpdate({
      title: 'CREATE_ZIP_FILE',
      isDone: true,
      // payload: {
      //   zipFile,
      // },
    });

    onStatusUpdate({
      title: 'CREATE_ENCRYPTION_KEY',
      isDone: false,
    });
    const encryptionKey = iexec.dataset.generateEncryptionKey();
    onStatusUpdate({
      title: 'CREATE_ENCRYPTION_KEY',
      isDone: true,
      // payload: {
      //   encryptionKey,
      // },
    });

    onStatusUpdate({
      title: 'ENCRYPT_FILE',
      isDone: false,
    });
    const encryptedFile = await iexec.dataset
      .encrypt(file, encryptionKey)
      .catch((e: Error) => {
        throw new WorkflowError('Failed to encrypt data', e);
      });
    const checksum = await iexec.dataset
      .computeEncryptedFileChecksum(encryptedFile)
      .catch((e: Error) => {
        throw new WorkflowError('Failed to compute encrypted data checksum', e);
      });
    onStatusUpdate({
      title: 'ENCRYPT_FILE',
      isDone: true,
      // payload: {
      //   encryptedFile,
      // },
    });

    onStatusUpdate({
      title: 'UPLOAD_ENCRYPTED_FILE',
      isDone: false,
    });
    const cid = await add(encryptedFile, {
      ipfsNode: vIpfsNodeUrl,
      ipfsGateway: vIpfsGateway,
    }).catch((e: Error) => {
      throw new WorkflowError('Failed to upload encrypted data', e);
    });
    const multiaddr = `/ipfs/${cid}`;
    onStatusUpdate({
      title: 'UPLOAD_ENCRYPTED_FILE',
      isDone: true,
      payload: {
        cid,
      },
    });

    const { provider, signer } = await iexec.config.resolveContractsClient();

    const contract = new ethers.Contract(contractAddress, ABI, provider);
    const multiaddrBytes = Multiaddr(multiaddr).bytes;
    const ownerAddress = await signer.getAddress();

    onStatusUpdate({
      title: 'DEPLOY_PROTECTED_DATA',
      isDone: false,
      // payload: {
      //   owner: ownerAddress,
      //   name: vName,
      //   schema: JSON.stringify(schema, null, 2),
      // },
    });
    const transactionReceipt = await (contract.connect(signer) as Contract) // workaround https://github.com/ethers-io/ethers.js/issues/4183
      .createDatasetWithSchema(
        ownerAddress,
        vName,
        JSON.stringify(schema),
        multiaddrBytes,
        checksum
      )
      .then((tx) => tx.wait())
      .catch((e: Error) => {
        throw new WorkflowError(
          'Failed to create protected data smart contract',
          e
        );
      });

    const protectedDataAddress = transactionReceipt.logs.find(
      ({ eventName }) => 'DatasetSchema' === eventName
    )?.args[0];

    const txHash = transactionReceipt.hash;
    const block = await provider.getBlock(transactionReceipt.blockNumber);
    const creationTimestamp = block.timestamp;

    onStatusUpdate({
      title: 'DEPLOY_PROTECTED_DATA',
      isDone: true,
      payload: {
        address: protectedDataAddress,
        owner: ownerAddress,
        creationTimestamp: String(creationTimestamp),
        txHash,
      },
    });

    // share secret with scone SMS
    onStatusUpdate({
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
        throw new WorkflowError(
          'Failed to push protected data encryption key',
          e
        );
      });
    onStatusUpdate({
      title: 'PUSH_SECRET_TO_SMS',
      isDone: true,
      payload: {
        teeFramework: 'scone',
      },
    });

    return {
      name,
      address: protectedDataAddress,
      owner: ownerAddress,
      schema,
      creationTimestamp,
      transactionHash: txHash,
      zipFile: file,
      encryptionKey,
    };
  } catch (e: any) {
    logger.log(e);
    if (e instanceof WorkflowError) {
      throw e;
    } else {
      throw new WorkflowError('Protect data unexpected error', e);
    }
  }
};
