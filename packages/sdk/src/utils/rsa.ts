import { getSavedKeyPair, storeKeyPair } from './indexedDb.js';

export async function getPemFormattedKeyPair({
  pemPrivateKey,
}: {
  pemPrivateKey?: string;
}): Promise<{
  pemPublicKey: string;
  pemPrivateKey: string;
}> {
  if (pemPrivateKey) {
    return loadKeyPair(pemPrivateKey);
  }
  return getOrGenerateKeyPair();
}

export function formatPemPublicKeyForSMS(pemPublicKey: string) {
  return toBase64(pemPublicKey);
}

export async function getOrGenerateKeyPair() {
  let keyPair: CryptoKeyPair;
  const existingKeyPair = await getSavedKeyPair();
  if (existingKeyPair) {
    keyPair = existingKeyPair.keyPair;
  } else {
    keyPair = await generateKeyPair();
    await storeKeyPair(keyPair);
  }
  return formatKeyPairAsPem(keyPair);
}

export async function loadKeyPair(pem: string) {
  const keyPair = await cryptoKeyPairFromPem(pem);
  return formatKeyPairAsPem(keyPair);
}

async function formatKeyPairAsPem(keyPair: CryptoKeyPair) {
  return {
    pemPublicKey: await publicAsPem(keyPair.publicKey),
    pemPrivateKey: await privateAsPem(keyPair.privateKey),
  };
}

export async function generateKeyPair() {
  const { crypto } = await getCrypto();
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 4096,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true, // extractable
    ['encrypt', 'decrypt']
  );
  return keyPair;
}

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

async function publicAsPem(publicKey: CryptoKey) {
  const { crypto } = await getCrypto();
  const publicKeyAsBuffer = await crypto.subtle.exportKey('spki', publicKey);
  let body = btoa(String.fromCharCode(...new Uint8Array(publicKeyAsBuffer)));
  body = body.match(/.{1,64}/g).join('\n');
  return `-----BEGIN PUBLIC KEY-----\n${body}\n-----END PUBLIC KEY-----`;
}

export async function privateAsPem(privateKey: CryptoKey) {
  const { crypto } = await getCrypto();
  const privateKeyAsBuffer = await crypto.subtle.exportKey('pkcs8', privateKey);
  let body = btoa(String.fromCharCode(...new Uint8Array(privateKeyAsBuffer)));
  body = body.match(/.{1,64}/g).join('\n');
  return `-----BEGIN PRIVATE KEY-----\n${body}\n-----END PRIVATE KEY-----`;
}

export async function cryptoKeyPairFromPem(
  pemPrivateKey: string
): Promise<CryptoKeyPair> {
  const { crypto } = await getCrypto();
  function pemToArrayBuffer(pem: string): ArrayBuffer {
    const b64Lines = pem
      .replace('-----BEGIN PRIVATE KEY-----', '')
      .replace('-----END PRIVATE KEY-----', '')
      .replace(/\s/g, '');
    const bStr = atob(b64Lines);
    const bytes = new Uint8Array(bStr.length);
    for (let i = 0; i < bStr.length; i++) {
      bytes[i] = bStr.charCodeAt(i);
    }
    return bytes.buffer;
  }
  // Import the private key
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(pemPrivateKey),
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    true, // extractable
    ['decrypt']
  );
  // Transform to JWK to derive the public key
  const jwk = await crypto.subtle.exportKey('jwk', privateKey);
  // Remove private components to create public JWK
  const publicJwk = {
    kty: jwk.kty,
    n: jwk.n,
    e: jwk.e,
    alg: jwk.alg,
    ext: true,
    key_ops: ['encrypt'],
  };
  const publicKey = await crypto.subtle.importKey(
    'jwk',
    publicJwk,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    true,
    ['encrypt']
  );
  return { privateKey, publicKey };
}

function toBase64(publicKeyAsPem: string) {
  return btoa(publicKeyAsPem);
}
