export async function getCrypto() {
  if (globalThis.crypto) {
    // Browser and Node >= 20
    return { crypto: globalThis.crypto, CryptoKey };
  }
  // Node <= 18 and webpack (needs polyfill)
  const crypto = await import(/* webpackIgnore: true */ 'crypto');
  return {
    crypto: crypto.webcrypto,
    CryptoKey: crypto.webcrypto.CryptoKey,
  };
}
export async function generateKeyPair() {
  const isExtractable = true;
  const { crypto } = await getCrypto();
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
  const { crypto } = await getCrypto();
  const publicKeyAsBuffer = await crypto.subtle.exportKey('spki', publicKey);

  let body = btoa(String.fromCharCode(...new Uint8Array(publicKeyAsBuffer)));
  body = body.match(/.{1,64}/g).join('\n');

  return `-----BEGIN PUBLIC KEY-----\n${body}\n-----END PUBLIC KEY-----`;
}

export async function privateAsPem(privateKey) {
  const { crypto } = await getCrypto();
  const privateKeyAsBuffer = await crypto.subtle.exportKey('pkcs8', privateKey);
  let body = btoa(String.fromCharCode(...new Uint8Array(privateKeyAsBuffer)));
  body = body.match(/.{1,64}/g).join('\n');
  return `-----BEGIN PRIVATE KEY-----\n${body}\n-----END PRIVATE KEY-----`;
}

function toBase64(publicKeyAsPem) {
  return btoa(publicKeyAsPem);
}
