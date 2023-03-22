import { Buffer } from 'buffer';
import { DEFAULT_IEXEC_IPFS_NODE_MULTIADDR } from './conf';
import { WorkflowError } from './errors';
import { add } from './ipfs-service';
import { throwIfMissing } from './validators';

const createCNFT = ({
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
export { createCNFT };
