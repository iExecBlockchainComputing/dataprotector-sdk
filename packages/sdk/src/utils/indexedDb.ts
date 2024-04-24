let db;

export async function storeKeyPair(publicKey: string, privateKey: CryptoKey) {
  if (!window || !('indexedDB' in window)) {
    return;
  }

  return new Promise((resolve, reject) => {
    const writeRequest = db
      .transaction('keyPair', 'readwrite')
      .objectStore('keyPair')
      .add({
        keyPairName: 'keyPair01',
        keyPair: {
          publicKey,
          privateKey,
        },
      });

    writeRequest.onerror = (err) => {
      console.error('[indexedDB] writeRequest() ERROR', err);
      reject(err);
    };

    writeRequest.onsuccess = () => {
      console.log('[indexedDB] keyPair saved');
      resolve('Done');
    };
  });
}

export async function getSavedKeyPair(): Promise<{
  keyPairName: string;
  keyPair: { publicKey: string; privateKey: SubtleCrypto };
}> {
  if (!window || !('indexedDB' in window)) {
    return;
  }

  return new Promise((resolve, reject) => {
    const openDbRequest = window.indexedDB.open('ContentCreator', 1);
    openDbRequest.onerror = (event) => {
      console.log('[indexedDB] openDbRequest() ERROR', event);
    };
    openDbRequest.onsuccess = () => {
      db = openDbRequest.result;

      const readRequest = db
        .transaction('keyPair')
        .objectStore('keyPair')
        .get('keyPair01');

      readRequest.onerror = (err) => {
        console.error('[indexedDB] readRequest() ERROR', err);
        reject(err);
      };

      readRequest.onsuccess = () => {
        const keyPair = readRequest.result;
        resolve(keyPair);
      };
    };
    openDbRequest.onupgradeneeded = () => {
      db = openDbRequest.result;

      // Create an objectStore for this database
      const objectStore = db.createObjectStore('keyPair', {
        keyPath: 'keyPairName',
      });

      objectStore.transaction.oncomplete = () => {
        const readKeyPairRequest = db
          .transaction('keyPair', 'readonly')
          .objectStore('keyPair')
          .get('keyPair');

        readKeyPairRequest.onerror = (event) => {
          console.log('[indexedDB] readKeyPairRequest() ERROR', event);
        };
        readKeyPairRequest.onsuccess = () => {
          resolve(readKeyPairRequest.result);
        };
      };
    };
  });
}
