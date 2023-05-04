import { create } from 'kubo-rpc-client';
import {
  DEFAULT_IEXEC_IPFS_NODE,
  DEFAULT_IPFS_GATEWAY,
} from '../config/config.js';

interface AddOptions {
  ipfsNodeMultiaddr?: string;
  ipfsGateway?: string;
}

const add = async (
  content: Uint8Array,
  {
    ipfsNodeMultiaddr = DEFAULT_IEXEC_IPFS_NODE,
    ipfsGateway = DEFAULT_IPFS_GATEWAY,
  }: AddOptions = {}
): Promise<string> => {
  try {
    const ipfs = create({ url: ipfsNodeMultiaddr });
    const uploadResult = await ipfs.add(content);
    const { cid } = uploadResult;
    const multiaddr = `ipfs/${cid.toString()}`;
    const publicUrl = `${ipfsGateway}/${multiaddr}`;

    await fetch(publicUrl).then((res) => {
      if (!res.ok) {
        throw Error(`Failed to load uploaded file at ${publicUrl}`);
      }
    });

    return cid.toString();
  } catch (e) {
    throw Error(e);
  }
};

export { add };
