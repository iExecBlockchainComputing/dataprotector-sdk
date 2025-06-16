import { multiaddr } from '@multiformats/multiaddr';

/**
 * Convert an hex string to a readable string
 * Ex:
 *  "0xa50322122038d76d7059153e707cd0951cf2ff64d17f69352a285503800c7787c3af0c63dd"
 * to
 *  "/p2p/QmSAY4mYRkCvdDzcD3A3sDeN5nChyn82p88xt7HhYHqXfi"
 */
export function getMultiaddrAsString({
  multiaddrAsHexString,
}: {
  multiaddrAsHexString?: string;
}) {
  if (!multiaddrAsHexString || multiaddrAsHexString.length < 3) {
    return undefined;
  }
  const multiAddrAsBytesArray = multiaddrAsHexString
    .slice(2)
    .match(/.{1,2}/g)
    ?.map((byte) => parseInt(byte, 16));
  if (!multiAddrAsBytesArray) {
    return undefined;
  }
  const multiaddrAsBytes = new Uint8Array(multiAddrAsBytesArray);

  // try utf8 encoded url
  try {
    const decodedString = new TextDecoder().decode(multiaddrAsBytes);
    if (decodedString.startsWith('https://')) {
      return decodedString;
    }
  } catch {
    // noop
  }

  // try machine format multiaddr
  try {
    const decodedMultiaddr = multiaddr(multiaddrAsBytes);
    return decodedMultiaddr.toString();
  } catch {
    // noop
  }

  console.warn(
    `[getMultiaddrAsString] ERROR: "${multiaddrAsHexString}" is not a valid hex encoded multiaddr?`
  );
  return undefined;
}
