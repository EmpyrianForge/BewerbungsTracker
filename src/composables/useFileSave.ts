import { ref } from 'vue'

// requestPermission is a Chrome/Edge-specific extension not yet in lib.dom.d.ts
declare global {
  interface FileSystemHandle {
    requestPermission(descriptor?: { mode?: 'read' | 'readwrite' }): Promise<PermissionState>
  }
}

const IS_SUPPORTED =
  typeof window !== 'undefined' &&
  'showSaveFilePicker' in window &&
  'showOpenFilePicker' in window

// ── IndexedDB helpers ──────────────────────────────────────────
// localStorage can't hold FileSystemFileHandle objects; IndexedDB can.
const DB_NAME = 'bt-filesave-v1'
const DB_STORE = 'handles'
const DB_KEY = 'save'

const openDb = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(DB_STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })

const idbGet = async (): Promise<FileSystemFileHandle | null> => {
  try {
    const db = await openDb()
    return await new Promise<FileSystemFileHandle | null>((resolve) => {
      const r = db.transaction(DB_STORE).objectStore(DB_STORE).get(DB_KEY)
      r.onsuccess = () => resolve((r.result as FileSystemFileHandle | undefined) ?? null)
      r.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}

const idbSet = async (handle: FileSystemFileHandle | null): Promise<void> => {
  try {
    const db = await openDb()
    await new Promise<void>((resolve) => {
      const tx = db.transaction(DB_STORE, 'readwrite')
      const store = tx.objectStore(DB_STORE)
      if (handle) {
        store.put(handle, DB_KEY)
      } else {
        store.delete(DB_KEY)
      }
      tx.oncomplete = () => resolve()
    })
  } catch {
    /* IndexedDB unavailable in some private-browsing modes — ignore */
  }
}

// ── Composable ─────────────────────────────────────────────────
export const useFileSave = () => {
  const isSupported = IS_SUPPORTED
  const activeHandle = ref<FileSystemFileHandle | null>(null)
  const activeFileName = ref('')
  const hasPermission = ref(false)
  const isSaving = ref(false)

  /** Grant readwrite permission and activate the handle */
  const activate = async (handle: FileSystemFileHandle): Promise<boolean> => {
    try {
      const perm = await handle.requestPermission({ mode: 'readwrite' })
      if (perm !== 'granted') return false
    } catch {
      return false
    }
    activeHandle.value = handle
    activeFileName.value = handle.name
    hasPermission.value = true
    return true
  }

  /** Call on app mount — silently restores the last-used handle */
  const init = async (): Promise<void> => {
    if (!IS_SUPPORTED) return
    const handle = await idbGet()
    if (handle) await activate(handle)
  }

  /** Show OS "Save As" dialog and remember the chosen file */
  const chooseSaveLocation = async (): Promise<boolean> => {
    if (!IS_SUPPORTED) return false
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: 'bewerbungen.json',
        types: [{ description: 'Bewerbungsdaten', accept: { 'application/json': ['.json'] } }],
      })
      await idbSet(handle)
      return activate(handle)
    } catch {
      return false // user cancelled
    }
  }

  /** Write JSON to the active file — debounce externally */
  const saveNow = async (content: string): Promise<void> => {
    if (!activeHandle.value || !hasPermission.value) return
    isSaving.value = true
    try {
      const writable = await activeHandle.value.createWritable()
      await writable.write(content)
      await writable.close()
    } catch {
      hasPermission.value = false // permission was revoked
    } finally {
      isSaving.value = false
    }
  }

  /** Open OS file picker, read content, and remember handle for future auto-saves */
  const loadFromFile = async (): Promise<string | null> => {
    if (!IS_SUPPORTED) return null
    try {
      const handles = await window.showOpenFilePicker({
        types: [{ description: 'Bewerbungsdaten', accept: { 'application/json': ['.json'] } }],
      })
      const handle = handles[0]
      if (!handle) return null
      await idbSet(handle)
      await activate(handle)
      const file = await handle.getFile()
      return file.text()
    } catch {
      return null // user cancelled
    }
  }

  return {
    isSupported,
    activeFileName,
    hasPermission,
    isSaving,
    init,
    chooseSaveLocation,
    saveNow,
    loadFromFile,
  }
}
