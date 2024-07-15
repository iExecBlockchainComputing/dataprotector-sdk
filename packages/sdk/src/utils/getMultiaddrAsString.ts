import { multiaddr } from '@multiformats/multiaddr';

export function getMultiaddrAsString({
  multiaddrAsHexString,
}: {
  multiaddrAsHexString: string;
}) {
  if (!multiaddrAsHexString || multiaddrAsHexString.length < 3) {
    return '';
  }
  const multiAddrAsBytesArray = multiaddrAsHexString
    .slice(2)
    .match(/.{1,2}/g)
    ?.map((byte) => parseInt(byte, 16));
  if (!multiAddrAsBytesArray) {
    return '';
  }
  try {
    const multiaddrAsBytes = new Uint8Array(multiAddrAsBytesArray);
    const decodedMultiaddr = multiaddr(multiaddrAsBytes);
    return decodedMultiaddr.toString();
  } catch (err) {
    console.warn(
      `[getMultiaddrAsString] ERROR: "${multiaddrAsHexString}" is not a valid hex input string?`,
      err
    );
    return '';
  }
}
