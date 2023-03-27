import { Buffer } from 'buffer';
import { IExec } from 'iexec';
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

const authorize = ({
  iexec = throwIfMissing(),
  dataset = throwIfMissing(),
  datasetprice,
  volume,
  tag,
  apprestrict,
  workerpoolrestrict,
  requesterrestrict,
}: {
  iexec: IExec;
  dataset: string;
  datasetprice?: number;
  volume?: number;
  tag?: string;
  apprestrict?: string;
  workerpoolrestrict?: string;
  requesterrestrict?: string;
}): Promise<string> =>
  new Promise(function (resolve, reject) {
    const start = async () => {
      try {
        const orderTemplate = await iexec.order
          .createDatasetorder({
            dataset,
            datasetprice,
            volume,
            tag,
            apprestrict,
            workerpoolrestrict,
            requesterrestrict,
          })
          .catch((e) => {
            throw new WorkflowError('Failed to create dataset order', e);
          });

        const signedOrder = await iexec.order
          .signDatasetorder(orderTemplate)
          .catch((e) => {
            throw new WorkflowError('Failed to sign dataset order', e);
          });
        console.log('Signed order', signedOrder);

        const orderHash = await iexec.order
          .publishDatasetorder(signedOrder)
          .catch((e) => {
            throw new WorkflowError('Failed to publish dataset order', e);
          });
        console.log(`Order published with hash ${orderHash}`);
        resolve(orderHash);
      } catch (e: any) {
        if (e instanceof WorkflowError) {
          reject(e);
        } else {
          reject(new WorkflowError('Order publish unexpected error', e));
        }
      }
    };
    start();
  });

const revoke = ({
  iexec = throwIfMissing(),
  dataset = throwIfMissing(),
  appAddress = throwIfMissing(),
}: {
  iexec: IExec;
  dataset: string;
  appAddress: string;
}): Promise<string> =>
  new Promise(function (resolve, reject) {
    const start = async () => {
      try {
        const publishedDatasetorders = await iexec.orderbook
          .fetchDatasetOrderbook(dataset)
          .catch((e) => {
            throw new WorkflowError('Failed to fetch dataset orderbook', e);
          });

        const order = publishedDatasetorders.orders.find(
          (datasetorder) => datasetorder.order.apprestrict === appAddress
        ).order;

        const { txHash } = await iexec.order.cancelDatasetorder(order);
        console.log(`Order canceled (tx:${txHash})`);
        resolve(txHash);
      } catch (e: any) {
        if (e instanceof WorkflowError) {
          reject(e);
        } else {
          reject(new WorkflowError('Order publish unexpected error', e));
        }
      }
    };
    start();
  });

export { createCNFT, authorize, revoke };
