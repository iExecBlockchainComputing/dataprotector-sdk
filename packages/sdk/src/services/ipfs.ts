import { create } from 'kubo-rpc-client';

interface AddOptions {
  ipfsNode?: string;
  ipfsGateway?: string;
}

const add = async (
  content: Uint8Array,
  { ipfsNode, ipfsGateway }: AddOptions = {}
): Promise<string> => {
  try {
    const ipfs = create({ url: ipfsNode });
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
