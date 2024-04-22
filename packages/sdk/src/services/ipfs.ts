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
    console.log('1');
    console.log('ipfsNode', ipfsNode);
    const ipfs = create({ url: ipfsNode });
    const uploadResult = await ipfs.add(content);
    console.log('uploadResult', uploadResult);
    const { cid } = uploadResult;
    const multiaddr = `ipfs/${cid.toString()}`;
    console.log('multiaddr', multiaddr);
    const publicUrl = `${ipfsGateway}/${multiaddr}`;
    console.log('publicUrl', publicUrl);

    // await fetch(publicUrl).then((res) => {
    //   if (!res.ok) {
    //     throw Error(`Failed to load uploaded file at ${publicUrl}`);
    //   }
    // });

    console.log('2');
    return cid.toString();
  } catch (e) {
    console.log('Boom catch', e);
    throw Error(e);
  }
};

export { add };
