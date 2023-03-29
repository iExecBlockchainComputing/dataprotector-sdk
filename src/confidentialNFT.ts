import { Buffer } from 'buffer';
import { DEFAULT_IEXEC_IPFS_NODE_MULTIADDR } from './conf';
import { createCNFTWithObservable } from './confidentialNFTWithObservable';
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
}): Promise<any> => {
  let cNFTAddress;
  let encryptionKey;
  let Ipfsmultiaddr;
  const promise = new Promise((resolve, reject) => {
    createCNFTWithObservable({
      iexec,
      data,
      name,
      ipfsNodeMultiaddr,
    }).subscribe(
      (data) => {
        const { message } = data;
        switch (message) {
          case 'ENCRYPTION_KEY_CREATED':
            encryptionKey = data.encryptionKey;
            break;
          case 'ENCRYPTED_FILE_UPLOADED':
            Ipfsmultiaddr = data.multiaddr;
            break;
          case 'CONFIDENTIAL_NFT_DEPLOYMENT_SUCCESS':
            cNFTAddress = data.address;
            break;
          default:
        }
      },
      (e) => reject(e),
      () => resolve({ cNFTAddress, encryptionKey, Ipfsmultiaddr })
    );
  });

  return promise;
};
export { createCNFT };
