import { getSavedKeyPair, storeKeyPair } from './indexedDb.js';

export async function getFormattedKeyPair({
  pemPublicKey,
  pemPrivateKey,
}: {
  pemPublicKey?: string;
  pemPrivateKey?: string;
}) {
  // Keypair is given, use it
  if (pemPublicKey && pemPrivateKey) {
    return {
      publicKey: toBase64(pemPublicKey),
      privateKey: pemPrivateKey,
    };
  }

  // Get keypair from indexedDB (if available) or generate a new one
  return getOrGenerateKeyPair();
}

export async function getOrGenerateKeyPair() {
  let publicKey: string;
  let privateKey: CryptoKey;
  const existingKeyPair = await getSavedKeyPair();
  if (existingKeyPair) {
    publicKey = existingKeyPair.keyPair.publicKey;
    privateKey = existingKeyPair.keyPair.privateKey;
  } else {
    const { publicKey: genPublicKey, privateKey: genPrivateKey } =
      await generateKeyPair();
    publicKey = genPublicKey;
    privateKey = genPrivateKey;

    await storeKeyPair(publicKey, privateKey);
  }
  return {
    publicKey,
    privateKey: await privateAsPem(privateKey),
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

async function formatPublicKeyForSMS(publicKey: CryptoKey) {
  const publicKeyAsPem = await publicAsPem(publicKey);
  return toBase64(publicKeyAsPem);
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

function toBase64(publicKeyAsPem: string) {
  return btoa(publicKeyAsPem);
}
