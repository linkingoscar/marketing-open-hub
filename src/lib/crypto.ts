"use client";

/**
 * 浏览器端 API Key 本地静态加密存储适配器 (AES-GCM 256-bit)
 *
 * 威胁模型与安全边界说明 (Threat Model):
 * - 本模块提供 browser-side encrypted-at-rest 本地静止加密存储，防止开发者工具、本地备份或一般物理接触直接查看 localStorage 明文 API Key；
 * - 安全边界说明：本机制无法完全防御同源上下文下的恶意 XSS 脚本执行（同源脚本拥有相同的 IndexedDB 访问权限）；
 * - 每次加密均采用 Web Crypto 随机生成的 96-bit (12 bytes) IV，严禁时间戳派生；
 * - 若加密失败，绝不执行静默明文降级写入。
 */

const DB_NAME = "martech-crypto";
const STORE_NAME = "keys";
const KEY_ID = "encryption-key";

function isCryptoAvailable(): boolean {
  return (
    typeof globalThis !== "undefined" &&
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.subtle !== "undefined" &&
    typeof indexedDB !== "undefined"
  );
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
      return await crypto.subtle.importKey("raw", existingKeyData, { name: "AES-GCM" }, false, [
        "encrypt",
        "decrypt",
      ]);
    } catch {
      // Key corrupted, generate new one
    }
  }

  // Generate new 256-bit key
  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true, // extractable to persist raw bytes into IndexedDB
    ["encrypt", "decrypt"]
  );

  // Export and store
  const exported = await crypto.subtle.exportKey("raw", key);
  await idbSet(KEY_ID, exported);

  return key;
}

/** Encrypt a string value using random 96-bit IV */
export async function encrypt(plaintext: string): Promise<string> {
  if (!isCryptoAvailable()) {
    throw new Error("Web Crypto API is not supported in this environment");
  }

  const key = await getEncryptionKey();
  if (!key) {
    throw new Error("Unable to initialize encryption key");
  }

  // Cryptographically random 96-bit (12-byte) IV for AES-GCM
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as unknown as BufferSource },
    key,
    encoded
  );

  // Prefix with IV (base64) so we can decrypt later
  const ivB64 = btoa(String.fromCharCode(...iv));
  const ctB64 = btoa(String.fromCharCode(...new Uint8Array(ciphertext)));
  return `enc:${ivB64}:${ctB64}`;
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
      { name: "AES-GCM", iv: iv as unknown as BufferSource },
      key,
      ct as unknown as BufferSource
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
      try {
        const encrypted = await encrypt(json);
        localStorage.setItem(name, encrypted);
      } catch (err) {
        console.error(`[Crypto] Failed to encrypt ${name}, refusing to store in plaintext:`, err);
      }
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
