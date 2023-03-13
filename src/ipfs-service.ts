import CID from 'cids';
import fetch from 'cross-fetch';
import Ipfs from 'ipfs';
import { DEFAULT_IPFS_GATEWAY } from './conf';
import { getLogger } from './logger';

const log = getLogger('ipfs-service');

interface GetOptions {
  ipfsGateway?: string;
}

interface AddOptions {
  ipfsGateway?: string;
}

const get = async (
  cid: CID | string,
  { ipfsGateway = DEFAULT_IPFS_GATEWAY }: GetOptions = {}
): Promise<Buffer> => {
  const multiaddr = `/ipfs/${cid.toString()}`;
  const publicUrl = `${ipfsGateway}${multiaddr}`;
  const res = await fetch(publicUrl);
  if (!res.ok) {
    throw Error(`Failed to load content from ${publicUrl}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

const add = async (
  content: Uint8Array,
  { ipfsGateway = DEFAULT_IPFS_GATEWAY }: AddOptions = {}
): Promise<string> => {
  const ipfs = await Ipfs.create();
  try {
    const { cid } = await ipfs.add(content);
    await ipfs.pin
      .add(cid, { timeout: 10000 })
      .catch((e) => log('Ipfs add pin failed', e));
    await get(cid.toString(), { ipfsGateway });
    await ipfs.stop();
    return cid.toString();
  } catch (e) {
    if (typeof ipfs.stop === 'function') {
      await ipfs.stop();
    }
    throw e;
  }
};

const isCid = (value: any): boolean => {
  try {
    const cid = new CID(value);
    return CID.isCID(cid);
  } catch (e) {
    return false;
  }
};

export { Ipfs, add, get, isCid };
