// IF USING THIS FROM NODE, UNCOMMENT THE FOLLOWING LINE
// import crypto from 'node:crypto';

export async function generateKeyPair() {
  const isExtractable = true;
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 4096,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    isExtractable,
    ['encrypt', 'decrypt']
  );

  const formattedPublicKey = await formatPublicKeyForSMS(keyPair.publicKey);

  return {
    publicKey: formattedPublicKey, // <- PEM key encoded in base64
    privateKey: keyPair.privateKey,
  };
}

async function formatPublicKeyForSMS(publicKey) {
  const publicKeyAsPem = await publicAsPem(publicKey);
  return toBase64(publicKeyAsPem);
}

export async function publicAsPem(publicKey) {
  const publicKeyAsBuffer = await crypto.subtle.exportKey('spki', publicKey);

  let body = btoa(String.fromCharCode(...new Uint8Array(publicKeyAsBuffer)));
  body = body.match(/.{1,64}/g).join('\n');

  return `-----BEGIN PUBLIC KEY-----\n${body}\n-----END PUBLIC KEY-----`;
}

function toBase64(publicKeyAsPem) {
  return btoa(publicKeyAsPem);
}
