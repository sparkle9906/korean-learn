import { Capacitor } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'

const MIGRATION_PREFIX = 'korea-learn-'

const DB_NAME = 'korea-learn'
const STORE_NAME = 'kv'
const DB_VERSION = 1

let dbPromise: Promise<IDBDatabase> | null = null

function openDatabase(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available'))
      return
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'))
  })
  return dbPromise
}

async function idbGet(key: string): Promise<string | null> {
  try {
    const db = await openDatabase()
    return await new Promise<string | null>((resolve, reject) => {
      const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(key)
      request.onsuccess = () => resolve(typeof request.result === 'string' ? request.result : null)
      request.onerror = () => reject(request.error ?? new Error('IndexedDB read failed'))
    })
  } catch {
    return null
  }
}

async function idbSet(key: string, value: string): Promise<void> {
  try {
    const db = await openDatabase()
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      transaction.objectStore(STORE_NAME).put(value, key)
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB write failed'))
      transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB write aborted'))
    })
  } catch {
    // The localStorage mirror remains the fallback when IndexedDB is unavailable.
  }
}

async function idbRemove(key: string): Promise<void> {
  try {
    const db = await openDatabase()
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      transaction.objectStore(STORE_NAME).delete(key)
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB delete failed'))
      transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB delete aborted'))
    })
  } catch {
    // Ignore: the localStorage mirror removal is handled separately.
  }
}

function readWebStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeWebStorage(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // The persistent store remains the source of truth when localStorage is unavailable.
  }
}

function removeWebStorage(key: string): void {
  try {
    window.localStorage.removeItem(key)
  } catch {
    // Ignore unavailable web storage.
  }
}

const isNativePlatform = (): boolean => Capacitor.isNativePlatform()

async function readNative(key: string): Promise<string | null> {
  try {
    const { value } = await Preferences.get({ key })
    if (value !== null) return value
  } catch {
    // Capacitor can be unavailable while running as a normal website.
  }
  return null
}

async function writeNative(key: string, value: string): Promise<void> {
  try {
    await Preferences.set({ key, value })
  } catch {
    // The localStorage mirror is the web fallback.
  }
}

async function removeNative(key: string): Promise<void> {
  try {
    await Preferences.remove({ key })
  } catch {
    // Ignore unavailable Capacitor storage.
  }
}

/**
 * Persists settings and study data:
 * - iOS / native: Capacitor Preferences (UserDefaults) is the source of truth.
 * - Web: IndexedDB is the source of truth.
 * - localStorage is kept as a sync mirror for fast first paint and for
 *   backwards compatibility with data written by older versions.
 */
export async function getStoredValue(key: string): Promise<string | null> {
  const legacy = readWebStorage(key)

  if (isNativePlatform()) {
    const value = await readNative(key)
    if (value !== null) return value
    if (legacy !== null) await writeNative(key, legacy)
    return legacy
  }

  const value = await idbGet(key)
  if (value !== null) return value
  if (legacy !== null) await idbSet(key, legacy)
  return legacy
}

export async function setStoredValue(key: string, value: string): Promise<void> {
  // Keep the localStorage mirror in sync so synchronous first-paint reads stay fast.
  writeWebStorage(key, value)
  if (isNativePlatform()) {
    await writeNative(key, value)
    return
  }
  await idbSet(key, value)
}

export async function removeStoredValue(key: string): Promise<void> {
  removeWebStorage(key)
  if (isNativePlatform()) {
    await removeNative(key)
    return
  }
  await idbRemove(key)
}

export async function migrateLegacyStudyStorage(): Promise<void> {
  let keys: string[] = []
  try {
    keys = Object.keys(window.localStorage).filter((key) => key.startsWith(MIGRATION_PREFIX))
  } catch {
    return
  }

  for (const key of keys) {
    const legacy = readWebStorage(key)
    if (legacy === null) continue
    if (isNativePlatform()) {
      const existing = await readNative(key)
      if (existing === null) await writeNative(key, legacy)
    } else {
      const existing = await idbGet(key)
      if (existing === null) await idbSet(key, legacy)
    }
  }
}
