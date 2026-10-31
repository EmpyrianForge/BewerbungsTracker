import { ref } from 'vue'

// ── Automatic backups ─────────────────────────────────────────
// Rolling snapshots of the company list in IndexedDB (much larger quota than
// localStorage). They let users undo mistakes ("ich habe alles kaputt gemacht")
// and recover data when localStorage was wiped or full.

export interface BackupEntry {
  id: number
  createdAt: string
  count: number
  reason: string
  data: string
  // When this automatic snapshot was first written; it keeps being refreshed until the interval is over
  startedAt?: string
}

export type BackupMeta = Omit<BackupEntry, 'data'>

const DB_NAME = 'bt-backups-v1'
const DB_STORE = 'snapshots'
const MAX_BACKUPS = 30
// At most one automatic snapshot per interval while the user keeps editing
const AUTO_INTERVAL_MS = 10 * 60 * 1000

const openDb = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(DB_STORE, { keyPath: 'id', autoIncrement: true })
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })

const readAll = async (): Promise<BackupEntry[]> => {
  try {
    const db = await openDb()
    return await new Promise<BackupEntry[]>((resolve) => {
      const r = db.transaction(DB_STORE).objectStore(DB_STORE).getAll()
      r.onsuccess = () => resolve((r.result as BackupEntry[]).sort((a, b) => b.id - a.id))
      r.onerror = () => resolve([])
    })
  } catch {
    return []
  }
}

const writeEntry = async (entry: Omit<BackupEntry, 'id'> | BackupEntry, deleteIds: number[]): Promise<void> => {
  try {
    const db = await openDb()
    await new Promise<void>((resolve) => {
      const tx = db.transaction(DB_STORE, 'readwrite')
      const store = tx.objectStore(DB_STORE)
      store.put(entry)
      for (const id of deleteIds) store.delete(id)
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
      tx.onabort = () => resolve()
    })
  } catch {
    /* IndexedDB unavailable (e.g. some private-browsing modes) — backups are best-effort */
  }
}

export const useBackups = () => {
  const backups = ref<BackupMeta[]>([])

  const refresh = async (): Promise<void> => {
    const all = await readAll()
    backups.value = all.map(({ data: _data, ...meta }) => meta)
  }

  /**
   * Store a snapshot. `force` skips the interval check and is used before
   * risky actions (import, restore, reseed) so they can always be undone.
   */
  const snapshot = async (data: string, count: number, reason: string, force = false): Promise<void> => {
    const all = await readAll()
    const latest = all[0]
    if (latest && latest.data === data) return
    if (count === 0 && !force) return
    const now = new Date().toISOString()

    // Within the interval, keep the newest automatic snapshot up to date instead of
    // adding a new one — so the latest backup is never more than a few seconds old.
    if (!force && latest && latest.startedAt && Date.now() - new Date(latest.startedAt).getTime() < AUTO_INTERVAL_MS) {
      await writeEntry({ ...latest, createdAt: now, count, data }, [])
      await refresh()
      return
    }

    const deleteIds = all.slice(MAX_BACKUPS - 1).map((b) => b.id)
    await writeEntry({ createdAt: now, count, reason, data, ...(force ? {} : { startedAt: now }) }, deleteIds)
    await refresh()
  }

  const getData = async (id: number): Promise<string | null> => {
    const all = await readAll()
    return all.find((b) => b.id === id)?.data ?? null
  }

  /** Newest backup that actually contains entries — used to recover an empty app */
  const latestNonEmpty = async (): Promise<BackupEntry | null> => {
    const all = await readAll()
    return all.find((b) => b.count > 0) ?? null
  }

  return { backups, refresh, snapshot, getData, latestNonEmpty }
}
