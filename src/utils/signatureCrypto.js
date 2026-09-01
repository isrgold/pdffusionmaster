// utils/signatureCrypto.js
// Transparent Web Crypto API (AES-GCM 256-bit) signature encryption module

const DB_NAME = 'PDFMasterCryptoDB';
const STORE_NAME = 'KeysStore';
const KEY_ALIAS = 'SignatureMasterKey';

// Open IndexedDB to securely store the non-exportable CryptoKey
const openKeyDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
};

// Retrieve or generate a non-exportable AES-256-GCM CryptoKey
let cachedKey = null;

export const getMasterKey = async () => {
  if (cachedKey) return cachedKey;

  const db = await openKeyDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  const existingKeyReq = new Promise((resolve, reject) => {
    const req = store.get(KEY_ALIAS);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  let key = await existingKeyReq;

  if (!key) {
    // Generate a fresh AES-256-GCM key bound strictly to this browser instance
    key = await window.crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      false, // non-exportable: key material cannot be extracted by scripts/extensions
      ['encrypt', 'decrypt']
    );

    const saveTx = db.transaction(STORE_NAME, 'readwrite');
    saveTx.objectStore(STORE_NAME).put(key, KEY_ALIAS);
  }

  cachedKey = key;
  return cachedKey;
};

// Encrypt a JavaScript object (e.g. signature dataUrl, width, height, name)
export const encryptSignatureData = async (dataObject) => {
  try {
    const key = await getMasterKey();
    const jsonString = JSON.stringify(dataObject);
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(jsonString);

    const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM

    const encryptedBuffer = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encodedData
    );

    return {
      v: 2, // Version 2 encrypted format
      encrypted: true,
      iv: Array.from(iv),
      ciphertext: Array.from(new Uint8Array(encryptedBuffer))
    };
  } catch (err) {
    console.error('Failed to encrypt signature:', err);
    throw err;
  }
};

// Decrypt an encrypted signature payload
export const decryptSignatureData = async (payload) => {
  if (!payload || !payload.encrypted) {
    // Legacy unencrypted object - return directly for migration
    return payload;
  }

  try {
    const key = await getMasterKey();
    const iv = new Uint8Array(payload.iv);
    const ciphertext = new Uint8Array(payload.ciphertext);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );

    const decoder = new TextDecoder();
    const jsonString = decoder.decode(decryptedBuffer);
    return JSON.parse(jsonString);
  } catch (err) {
    console.error('Failed to decrypt signature:', err);
    return null;
  }
};
