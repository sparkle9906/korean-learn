import { Preferences } from '@capacitor/preferences'

const MIGRATION_PREFIX = 'korea-learn-'

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
    // The native store remains the source of truth when localStorage is unavailable.
  }
}

/**
 * Persists settings and study data through Capacitor Preferences on iOS, with a
 * localStorage mirror for normal browser use and backwards compatibility.
 */
export async function getStoredValue(key: string): Promise<string | null> {
  try {
    const { value } = await Preferences.get({ key })
    if (value !== null) return value

    const legacyValue = readWebStorage(key)
    if (legacyValue !== null) {
      await Preferences.set({ key, value: legacyValue })
      return legacyValue
    }
  } catch {
    // Capacitor can be unavailable while running as a normal website.
  }

  return readWebStorage(key)
}

export async function setStoredValue(key: string, value: string): Promise<void> {
  writeWebStorage(key, value)
  try {
    await Preferences.set({ key, value })
  } catch {
    // localStorage is the web fallback.
  }
}

export async function removeStoredValue(key: string): Promise<void> {
  try {
    window.localStorage.removeItem(key)
  } catch {
    // Ignore unavailable web storage.
  }
  try {
    await Preferences.remove({ key })
  } catch {
    // Ignore unavailable Capacitor storage.
  }
}

export async function migrateLegacyStudyStorage(): Promise<void> {
  try {
    const keys = Object.keys(window.localStorage).filter((key) => key.startsWith(MIGRATION_PREFIX))
    for (const key of keys) {
      const { value } = await Preferences.get({ key })
      if (value === null) {
        const legacyValue = readWebStorage(key)
        if (legacyValue !== null) await Preferences.set({ key, value: legacyValue })
      }
    }
  } catch {
    // No migration is needed or native storage is unavailable.
  }
}
