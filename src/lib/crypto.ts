"use client";

/**
 * Web Crypto API based encryption for API keys stored in localStorage.
 *
 * Architecture:
 * - On first use, generates a random 256-bit AES-GCM key + IV prefix
 * - Stores the key material in IndexedDB (non-extractable)
 * - Encrypts values before writing to localStorage
 * - Decrypts values after reading from localStorage
 * - Falls back to plaintext if crypto is unavailable (SSR / old browsers)
 */

const DB_NAME = "martech-crypto";
const STORE_NAME = "keys";
const KEY_ID = "encryption-key";
const SALT_ID = "encryption-salt";

function isCryptoAvailable(): boolean {
  return typeof globalThis !== "undefined"
    && typeof globalThis.crypto !== "undefined"
    && typeof globalThis.crypto.subtle !== "undefined"
    && typeof indexedDB !== "undefined";
}

/** Open IndexedDB or return null */
function openDB(): Promise<IDBDatabase | null> {
  if (!isCryptoAvailable()) return Promise.resolve(null);
  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
}

/** Read a value from the IndexedDB key-value store */
async function idbGet(key: string): Promise<ArrayBuffer | null> {
  const db = await openDB();
  if (!db) return null;
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => resolve(null);
  });
}

/** Write a value to the IndexedDB key-value store */
async function idbSet(key: string, value: ArrayBuffer): Promise<void> {
  const db = await openDB();
  if (!db) return;
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

/** Get or create the AES-GCM encryption key */
async function getEncryptionKey(): Promise<CryptoKey | null> {
  if (!isCryptoAvailable()) return null;

  // Check if key already exists
  const existingKeyData = await idbGet(KEY_ID);
  if (existingKeyData) {
    try {
      return await crypto.subtle.importKey(
        "raw",
        existingKeyData,
        { name: "AES-GCM" },
        false,
        ["encrypt", "decrypt"]
      );
    } catch {
      // Key corrupted, generate new one
    }
  }

  // Generate new 256-bit key
  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true, // extractable so we can store it
    ["encrypt", "decrypt"]
  );

  // Export and store
  const exported = await crypto.subtle.exportKey("raw", key);
  await idbSet(KEY_ID, exported);

  return key;
}

/** Get or create a random salt for IV generation */
async function getSalt(): Promise<Uint8Array> {
  const existing = await idbGet(SALT_ID);
  if (existing) return new Uint8Array(existing);

  const salt = crypto.getRandomValues(new Uint8Array(16));
  await idbSet(SALT_ID, salt.buffer);
  return salt;
}

/** Generate a deterministic IV from the salt + a counter (to avoid storing IVs) */
function generateIV(salt: Uint8Array, counter: number): Uint8Array {
  const iv = new Uint8Array(12);
  iv.set(salt.slice(0, 8));
  // Encode counter in last 4 bytes
  iv[8] = (counter >>> 24) & 0xff;
  iv[9] = (counter >>> 16) & 0xff;
  iv[10] = (counter >>> 8) & 0xff;
  iv[11] = counter & 0xff;
  return iv;
}

/** Encrypt a string value */
export async function encrypt(plaintext: string): Promise<string> {
  if (!isCryptoAvailable()) return plaintext;

  try {
    const key = await getEncryptionKey();
    if (!key) return plaintext;

    const salt = await getSalt();
    const iv = generateIV(salt, Date.now());
    const encoded = new TextEncoder().encode(plaintext);

    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      encoded
    );

    // Prefix with IV (base64) so we can decrypt later
    const ivB64 = btoa(String.fromCharCode(...iv));
    const ctB64 = btoa(String.fromCharCode(...new Uint8Array(ciphertext)));
    return `enc:${ivB64}:${ctB64}`;
  } catch {
    return plaintext;
  }
}

/** Decrypt an encrypted value */
export async function decrypt(ciphertext: string): Promise<string> {
  if (!isCryptoAvailable() || !ciphertext.startsWith("enc:")) return ciphertext;

  try {
    const key = await getEncryptionKey();
    if (!key) return ciphertext;

    const parts = ciphertext.split(":");
    if (parts.length !== 3) return ciphertext;

    const iv = Uint8Array.from(atob(parts[1]), (c) => c.charCodeAt(0));
    const ct = Uint8Array.from(atob(parts[2]), (c) => c.charCodeAt(0));

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ct
    );

    return new TextDecoder().decode(decrypted);
  } catch {
    return ciphertext;
  }
}

/**
 * Create a Zustand-compatible encrypted storage adapter.
 * Wraps the default localStorage with encrypt/decrypt.
 */
export function createEncryptedStorage<T>() {
  return {
    getItem: async (name: string): Promise<T | null> => {
      const raw = localStorage.getItem(name);
      if (!raw) return null;

      try {
        const decrypted = await decrypt(raw);
        return JSON.parse(decrypted) as T;
      } catch {
        // Fallback: try parsing as-is (migration from plaintext)
        try {
          return JSON.parse(raw) as T;
        } catch {
          return null;
        }
      }
    },
    setItem: async (name: string, value: T): Promise<void> => {
      const json = JSON.stringify(value);
      const encrypted = await encrypt(json);
      localStorage.setItem(name, encrypted);
    },
    removeItem: (name: string): void => {
      localStorage.removeItem(name);
    },
  };
}

/**
 * Encrypt existing plaintext localStorage data in-place.
 * Call once on app init to migrate from plaintext to encrypted.
 */
export async function migratePlaintextStorage(storageKey: string): Promise<void> {
  if (!isCryptoAvailable()) return;

  const raw = localStorage.getItem(storageKey);
  if (!raw || raw.startsWith("enc:")) return; // already encrypted or empty

  try {
    // Verify it's valid JSON before encrypting
    JSON.parse(raw);
    const encrypted = await encrypt(raw);
    localStorage.setItem(storageKey, encrypted);
    console.info(`[Crypto] Migrated ${storageKey} to encrypted storage`);
  } catch {
    // Not valid JSON, leave as-is
  }
}
