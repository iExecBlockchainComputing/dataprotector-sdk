import { Buffer } from 'buffer';
import { DEFAULT_IEXEC_IPFS_NODE_MULTIADDR } from '../config';
import { WorkflowError } from '../utils/errors';
import { add } from '../services/ipfs';
import { throwIfMissing } from '../utils/validators';
import { IProtectDataOptions } from './types';

export const protectData = ({
  iexec = throwIfMissing(),
  data = throwIfMissing(),
  name = throwIfMissing(),
  ipfsNodeMultiaddr = DEFAULT_IEXEC_IPFS_NODE_MULTIADDR,
}: IProtectDataOptions): Promise<any> =>
  new Promise(function (resolve, reject) {
    const start = async () => {
      try {
        const encryptionKey = iexec.dataset.generateEncryptionKey();
        if (typeof data === 'string') {
          data = Buffer.from(data, 'utf8');
        }
        const encryptedFile = await iexec.dataset
          .encrypt(data, encryptionKey)
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
