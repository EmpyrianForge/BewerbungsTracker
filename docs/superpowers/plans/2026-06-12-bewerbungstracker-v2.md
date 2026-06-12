# BewerbungsTracker v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Ampelsystem (outreach traffic light), File System Access API for persistent saves, and an update-detection banner to the BewerbungsTracker Vue 3 SPA.

**Architecture:** Three independent feature slices layered on top of the existing `useCompanies` composable and `App.vue` list/kanban layout. New types flow into the form modal and list view. A new `useFileSave` composable handles the File System Access API with IndexedDB persistence. Version detection lives in App.vue on mount.

**Tech Stack:** Vue 3 + Composition API, TypeScript, Vite, localStorage (existing), IndexedDB (new — no extra deps), File System Access API (Chrome/Edge only, graceful fallback)

---

## File Map

| File | Change |
|------|--------|
| `src/types/company.ts` | Add `OutreachStatus`, `RedReason` types; extend `Company` + `CompanyInput` |
| `src/composables/useCompanies.ts` | Update `toCompany()` with v2 field defaults (migration) |
| `src/composables/useFileSave.ts` | **NEW** — IndexedDB + File System Access API composable |
| `src/components/CompanyFormModal.vue` | Add Ampel-Selector section with conditional RedReason sub-form |
| `src/App.vue` | Ampel dot column, mini-popup, 3-dot menu, update banner, What's New modal |

---

## Task 1: Types

**Files:**
- Modify: `src/types/company.ts`

- [ ] **Step 1: Add OutreachStatus and RedReason types, extend Company + CompanyInput**

Replace the entire file content:

```typescript
export const STATUSES = [
  'Interested',
  'Applied',
  'Interviewing',
  'Offer',
  'Rejected',
  'Archived',
] as const

export type CompanyStatus = (typeof STATUSES)[number]

export type OutreachStatus = 'green' | 'yellow' | 'red'

export type RedReason = 'kein-ausbilder' | 'absage-generell' | 'absage-kapazitaet'

export const RED_REASON_LABELS: Record<RedReason, { short: string; description: string }> = {
  'kein-ausbilder': {
    short: 'Kein Ausbilder',
    description: 'Firma bietet keine Ausbildungsplätze an',
  },
  'absage-generell': {
    short: 'Absage generell',
    description: 'Firma nimmt grundsätzlich keine Bewerber',
  },
  'absage-kapazitaet': {
    short: 'Absage Kapazität',
    description: 'Nur dieses Mal abgesagt — andere TN können schreiben',
  },
}

export interface Company {
  id: string
  name: string
  role: string
  location: string
  url: string
  contact: string
  salaryRange: string
  source: string
  status: CompanyStatus
  createdAt: string
  updatedAt: string
  notes: string
  tags: string[]
  nextFollowUpDate?: string
  lastActionAt?: string
  lastActionNote: string
  outreachStatus: OutreachStatus
  redReason?: RedReason
}

export interface CompanyInput {
  name: string
  role: string
  location: string
  url: string
  contact: string
  salaryRange: string
  source: string
  status: CompanyStatus
  notes: string
  tags: string[]
  nextFollowUpDate?: string
  lastActionAt?: string
  lastActionNote: string
  outreachStatus: OutreachStatus
  redReason?: RedReason
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd C:\Users\kvnba\BewerbungsTracker
npx tsc --noEmit
```

Expected: errors about `outreachStatus` missing in `useCompanies.ts` and `CompanyFormModal.vue` — that's fine, we fix those in the next tasks.

- [ ] **Step 3: Commit**

```bash
git add src/types/company.ts
git commit -m "feat(types): add OutreachStatus, RedReason types to Company"
```

---

## Task 2: Migration — update toCompany() with v2 defaults

**Files:**
- Modify: `src/composables/useCompanies.ts`

- [ ] **Step 1: Update toCompany() to include new fields with defaults**

In `toCompany()`, the `return` statement currently ends at `lastActionNote`. Replace it with:

```typescript
const isOutreachStatus = (value: unknown): value is OutreachStatus => {
  return value === 'green' || value === 'yellow' || value === 'red'
}

const isRedReason = (value: unknown): value is RedReason => {
  return value === 'kein-ausbilder' || value === 'absage-generell' || value === 'absage-kapazitaet'
}
```

Add these two helper functions after `isStatus` (around line 18). Then update the `return` block inside `toCompany()` — replace the closing of the return object (after `lastActionNote`) to add the new fields:

```typescript
  return {
    id,
    name,
    role: normalizeString(item.role),
    location: normalizeString(item.location),
    url: normalizeString(item.url),
    contact: normalizeString(item.contact),
    salaryRange: normalizeString(item.salaryRange),
    source: normalizeString(item.source),
    status: isStatus(item.status) ? item.status : 'Interested',
    createdAt: normalizeDateField(item.createdAt) ?? now,
    updatedAt: normalizeDateField(item.updatedAt) ?? now,
    notes: normalizeString(item.notes),
    tags: [...new Set(tags)],
    nextFollowUpDate: normalizeDateField(item.nextFollowUpDate),
    lastActionAt: normalizeDateField(item.lastActionAt),
    lastActionNote: normalizeString(item.lastActionNote),
    outreachStatus: isOutreachStatus(item.outreachStatus) ? item.outreachStatus : 'yellow',
    redReason: isRedReason(item.redReason) ? item.redReason : undefined,
  }
```

- [ ] **Step 2: Update the import line at the top of useCompanies.ts**

Change:
```typescript
import { STATUSES, type Company, type CompanyInput, type CompanyStatus } from '../types/company'
```
To:
```typescript
import { STATUSES, type Company, type CompanyInput, type CompanyStatus, type OutreachStatus, type RedReason } from '../types/company'
```

- [ ] **Step 3: Add updateCompanyOutreach function to the composable**

After `updateCompanyStatus` (around line 153), add:

```typescript
  const updateCompanyOutreach = (id: string, outreachStatus: OutreachStatus, redReason?: RedReason) => {
    companies.value = companies.value.map((company) => {
      if (company.id !== id) return company
      return {
        ...company,
        outreachStatus,
        redReason: outreachStatus === 'red' ? redReason : undefined,
        updatedAt: new Date().toISOString(),
      }
    })
  }
```

And add it to the return object at the end:
```typescript
  return {
    companies: sortedCompanies,
    addCompany,
    updateCompany,
    updateCompanyStatus,
    updateCompanyOutreach,
    deleteCompany,
    importCompaniesFromJson,
    mergeImportedCompanies,
    exportCompaniesJson,
  }
```

- [ ] **Step 4: Verify TypeScript — expect errors in App.vue and FormModal only**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/composables/useCompanies.ts
git commit -m "feat(composable): v2 migration — outreachStatus/redReason defaults in toCompany"
```

---

## Task 3: useFileSave composable (File System Access API)

**Files:**
- Create: `src/composables/useFileSave.ts`

- [ ] **Step 1: Create the composable**

```typescript
// src/composables/useFileSave.ts
import { ref } from 'vue'

const DB_NAME = 'apply-tracker-fs'
const STORE_NAME = 'handles'
const HANDLE_KEY = 'save-file-handle'

const openDb = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })

const getStoredHandle = async (): Promise<FileSystemFileHandle | null> => {
  try {
    const db = await openDb()
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const req = tx.objectStore(STORE_NAME).get(HANDLE_KEY)
      req.onsuccess = () => resolve((req.result as FileSystemFileHandle) ?? null)
      req.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}

const storeHandle = async (handle: FileSystemFileHandle): Promise<void> => {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const req = tx.objectStore(STORE_NAME).put(handle, HANDLE_KEY)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

export const isFileSystemAccessSupported = (): boolean =>
  typeof window !== 'undefined' && 'showSaveFilePicker' in window

export const useFileSave = () => {
  const hasSaveFile = ref(false)
  const saveFileName = ref<string>('')
  const isDirty = ref(false)

  const init = async () => {
    const handle = await getStoredHandle()
    if (!handle) return
    try {
      const permission = await handle.queryPermission({ mode: 'readwrite' })
      if (permission === 'granted') {
        hasSaveFile.value = true
        saveFileName.value = handle.name
      }
    } catch {
      // handle stale — ignore
    }
  }

  const pickSaveFile = async (data: string): Promise<boolean> => {
    if (!isFileSystemAccessSupported()) return false
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: 'bewerbungen.json',
        types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }],
      })
      const writable = await handle.createWritable()
      await writable.write(data)
      await writable.close()
      await storeHandle(handle)
      hasSaveFile.value = true
      saveFileName.value = handle.name
      isDirty.value = false
      return true
    } catch {
      return false
    }
  }

  const saveToFile = async (data: string): Promise<boolean> => {
    const handle = await getStoredHandle()
    if (!handle) return false
    try {
      const permission = await handle.requestPermission({ mode: 'readwrite' })
      if (permission !== 'granted') return false
      const writable = await handle.createWritable()
      await writable.write(data)
      await writable.close()
      isDirty.value = false
      return true
    } catch {
      return false
    }
  }

  const loadFromFile = async (): Promise<string | null> => {
    const handle = await getStoredHandle()
    if (handle) {
      try {
        const permission = await handle.requestPermission({ mode: 'read' })
        if (permission === 'granted') {
          const file = await handle.getFile()
          return await file.text()
        }
      } catch {
        // fall through to picker
      }
    }
    if (!isFileSystemAccessSupported()) return null
    try {
      const [picked] = await (window as any).showOpenFilePicker({
        types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }],
      })
      const file = await picked.getFile()
      return await file.text()
    } catch {
      return null
    }
  }

  return { hasSaveFile, saveFileName, isDirty, init, pickSaveFile, saveToFile, loadFromFile }
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no new errors from this file.

- [ ] **Step 3: Commit**

```bash
git add src/composables/useFileSave.ts
git commit -m "feat(composable): useFileSave — File System Access API + IndexedDB handle persistence"
```

---

## Task 4: CompanyFormModal — Ampel-Selector

**Files:**
- Modify: `src/components/CompanyFormModal.vue`

- [ ] **Step 1: Update the import line**

Change line 3:
```typescript
import { STATUSES, type Company, type CompanyInput } from '../types/company'
```
To:
```typescript
import { STATUSES, RED_REASON_LABELS, type Company, type CompanyInput, type OutreachStatus, type RedReason } from '../types/company'
```

- [ ] **Step 2: Update emptyForm() to include new fields**

Replace `emptyForm()` (lines 16–30):
```typescript
const emptyForm = (): CompanyInput => ({
  name: '',
  role: '',
  location: '',
  url: '',
  contact: '',
  salaryRange: '',
  source: '',
  status: 'Interested',
  notes: '',
  tags: [],
  nextFollowUpDate: undefined,
  lastActionAt: undefined,
  lastActionNote: '',
  outreachStatus: 'yellow',
  redReason: undefined,
})
```

- [ ] **Step 3: Update the watch block to copy new fields from source company**

In the `Object.assign(form, { ... })` block (lines 56–70), add after `lastActionNote: source.lastActionNote,`:
```typescript
      outreachStatus: source.outreachStatus,
      redReason: source.redReason,
```

- [ ] **Step 4: Add Ampel section to the template**

In the `<form>` template, add this block after the `Status` label block (after line 141 `</label>`):

```html
        <div class="form-section">
          <label class="form-label">Erreichbarkeit der Firma</label>
          <div class="ampel-buttons">
            <button
              type="button"
              class="ampel-btn green"
              :class="{ active: form.outreachStatus === 'green' }"
              @click="form.outreachStatus = 'green'; form.redReason = undefined"
            >
              ● Grün — Anschreiben
            </button>
            <button
              type="button"
              class="ampel-btn yellow"
              :class="{ active: form.outreachStatus === 'yellow' }"
              @click="form.outreachStatus = 'yellow'; form.redReason = undefined"
            >
              ● Gelb — Keine Info
            </button>
            <button
              type="button"
              class="ampel-btn red"
              :class="{ active: form.outreachStatus === 'red' }"
              @click="form.outreachStatus = 'red'"
            >
              ● Rot — Nicht anschreiben
            </button>
          </div>
          <div v-if="form.outreachStatus === 'red'" class="red-reason-box">
            <span class="form-label-small">Grund (Pflichtfeld)</span>
            <label
              v-for="(info, key) in RED_REASON_LABELS"
              :key="key"
              class="red-reason-option"
            >
              <input
                type="radio"
                :value="key"
                v-model="form.redReason"
              />
              <div>
                <strong>{{ info.short }}</strong>
                <span class="reason-desc">{{ info.description }}</span>
              </div>
            </label>
          </div>
        </div>
```

- [ ] **Step 5: Add styles to the component**

Add a `<style scoped>` block at the end of the file:

```html
<style scoped>
.form-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.form-label {
  font-weight: 600;
  font-size: 0.875rem;
}
.form-label-small {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-muted, #888);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.ampel-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.ampel-btn {
  padding: 6px 14px;
  border-radius: 6px;
  border: 2px solid transparent;
  cursor: pointer;
  font-size: 0.8rem;
  background: transparent;
  transition: all 0.15s;
}
.ampel-btn.green { border-color: #22c55e; color: #15803d; }
.ampel-btn.green.active { background: #f0fdf4; font-weight: 700; }
.ampel-btn.yellow { border-color: #eab308; color: #a16207; }
.ampel-btn.yellow.active { background: #fefce8; font-weight: 700; }
.ampel-btn.red { border-color: #ef4444; color: #b91c1c; }
.ampel-btn.red.active { background: #fef2f2; font-weight: 700; }
.red-reason-box {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.red-reason-option {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  cursor: pointer;
  font-weight: normal;
}
.red-reason-option input { margin-top: 3px; flex-shrink: 0; }
.red-reason-option div { display: flex; flex-direction: column; gap: 2px; }
.reason-desc { font-size: 0.75rem; color: #888; }
</style>
```

- [ ] **Step 6: Run dev server and verify form opens without errors**

```bash
npm run dev
```

Open http://localhost:5173, click "+ Add Company", verify Ampel-Selector appears below Status field.

- [ ] **Step 7: Commit**

```bash
git add src/components/CompanyFormModal.vue
git commit -m "feat(form): add Ampel-Selector with RedReason sub-form to CompanyFormModal"
```

---

## Task 5: App.vue — Ampel dot column in list + mini-popup

**Files:**
- Modify: `src/App.vue`

- [ ] **Step 1: Update imports**

At the top of `<script setup>`, change the company import to include new types:
```typescript
import { STATUSES, RED_REASON_LABELS, type Company, type CompanyInput, type CompanyStatus, type OutreachStatus, type RedReason } from './types/company'
```

And add `updateCompanyOutreach` to the destructure of `useCompanies()`:
```typescript
const {
  companies,
  addCompany,
  updateCompany,
  updateCompanyStatus,
  updateCompanyOutreach,
  deleteCompany,
  importCompaniesFromJson,
  mergeImportedCompanies,
  exportCompaniesJson,
} = useCompanies()
```

- [ ] **Step 2: Add mini-popup state**

After `const draggedCompanyId = ref...`, add:
```typescript
const ampelPopupId = ref<string | null>(null)
const ampelPopupPendingReason = ref<RedReason | undefined>(undefined)

const openAmpelPopup = (id: string) => {
  ampelPopupId.value = id
  ampelPopupPendingReason.value = undefined
}

const closeAmpelPopup = () => {
  ampelPopupId.value = null
  ampelPopupPendingReason.value = undefined
}

const applyAmpelChange = (id: string, status: OutreachStatus) => {
  if (status === 'red' && !ampelPopupPendingReason.value) return
  updateCompanyOutreach(id, status, ampelPopupPendingReason.value)
  closeAmpelPopup()
}
```

- [ ] **Step 3: Add ampel dot column to the list table header**

In the `<thead><tr>` inside the list section (currently starts with `<th>Company</th>`), add a new first `<th>` before Company:

```html
<th class="col-ampel" aria-label="Erreichbarkeit"></th>
```

- [ ] **Step 4: Add ampel dot cell to each table row**

In the `<tr v-for="company in ...">` tbody, add a new first `<td>` before the Company `<td>`:

```html
            <td class="col-ampel">
              <div class="ampel-cell">
                <button
                  type="button"
                  class="ampel-dot"
                  :class="company.outreachStatus"
                  :title="company.outreachStatus === 'red' && company.redReason ? RED_REASON_LABELS[company.redReason].short : ''"
                  @click.stop="openAmpelPopup(company.id)"
                />
                <div v-if="ampelPopupId === company.id" class="ampel-popup" @click.stop>
                  <div class="ampel-popup-row">
                    <button type="button" class="ampel-dot green" @click="applyAmpelChange(company.id, 'green')" title="Grün: Anschreiben" />
                    <button type="button" class="ampel-dot yellow" @click="applyAmpelChange(company.id, 'yellow')" title="Gelb: Keine Info" />
                    <button type="button" class="ampel-dot red"
                      :class="{ active: ampelPopupPendingReason !== undefined }"
                      @click="applyAmpelChange(company.id, 'red')"
                      title="Rot: Nicht anschreiben"
                    />
                  </div>
                  <div v-if="ampelPopupId === company.id && /* show reason sub-menu when red selected */ false" class="ampel-popup-reasons">
                    <!-- reasons shown below -->
                  </div>
                  <template v-if="ampelPopupId === company.id">
                    <div class="ampel-popup-reasons">
                      <label v-for="(info, key) in RED_REASON_LABELS" :key="key" class="ampel-reason-label">
                        <input type="radio" :value="key" v-model="ampelPopupPendingReason" />
                        {{ info.short }}
                      </label>
                      <button
                        v-if="ampelPopupPendingReason"
                        type="button"
                        class="ampel-reason-confirm"
                        @click="applyAmpelChange(company.id, 'red')"
                      >
                        Bestätigen
                      </button>
                    </div>
                  </template>
                </div>
              </div>
            </td>
```

**Note:** The popup shows green/yellow/red quick buttons. Red immediately opens the reason sub-section. Once a reason is selected, a "Bestätigen" button confirms.

Simplify the popup template — replace the `<td class="col-ampel">` block with this cleaner version:

```html
            <td class="col-ampel">
              <div class="ampel-cell" style="position:relative;">
                <button
                  type="button"
                  class="ampel-dot"
                  :class="company.outreachStatus"
                  :title="company.outreachStatus === 'red' && company.redReason ? RED_REASON_LABELS[company.redReason].short : undefined"
                  @click.stop="ampelPopupId === company.id ? closeAmpelPopup() : openAmpelPopup(company.id)"
                />
                <div v-if="ampelPopupId === company.id" class="ampel-popup" @click.stop>
                  <div class="ampel-popup-colors">
                    <button type="button" class="ampel-dot green" title="Grün" @click="updateCompanyOutreach(company.id, 'green'); closeAmpelPopup()" />
                    <button type="button" class="ampel-dot yellow" title="Gelb" @click="updateCompanyOutreach(company.id, 'yellow'); closeAmpelPopup()" />
                    <button type="button" class="ampel-dot red" title="Rot" @click="ampelPopupPendingReason = undefined" :class="{ 'ring': ampelPopupPendingReason !== undefined || company.outreachStatus === 'red' }" />
                  </div>
                  <div class="ampel-popup-reasons">
                    <label v-for="(info, key) in RED_REASON_LABELS" :key="key" class="ampel-reason-label">
                      <input type="radio" :value="key" v-model="ampelPopupPendingReason" />
                      {{ info.short }}
                    </label>
                    <button
                      v-if="ampelPopupPendingReason"
                      type="button"
                      class="ampel-reason-confirm"
                      @click="updateCompanyOutreach(company.id, 'red', ampelPopupPendingReason); closeAmpelPopup()"
                    >Rot setzen</button>
                  </div>
                </div>
              </div>
            </td>
```

- [ ] **Step 5: Close popup on outside click**

In `onMounted`, add:
```typescript
  const handleOutsideClick = () => closeAmpelPopup()
  document.addEventListener('click', handleOutsideClick)
  // store ref for cleanup:
  removeThemeListener = () => {
    mediaQuery.removeEventListener('change', handleSystemThemeChange)
    document.removeEventListener('click', handleOutsideClick)
  }
```

(Replace existing `removeThemeListener` assignment with this combined version.)

- [ ] **Step 6: Add styles**

In `style.css` or as a `<style>` block in App.vue, add:

```css
.col-ampel { width: 36px; text-align: center; padding: 4px 6px; }
.ampel-cell { display: flex; justify-content: center; align-items: center; position: relative; }
.ampel-dot {
  display: inline-block;
  width: 14px; height: 14px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  flex-shrink: 0;
  transition: transform 0.1s;
}
.ampel-dot:hover { transform: scale(1.2); }
.ampel-dot.green { background: #22c55e; }
.ampel-dot.yellow { background: #eab308; }
.ampel-dot.red { background: #ef4444; }
.ampel-dot.ring { box-shadow: 0 0 0 2px #ef4444; }
.ampel-popup {
  position: absolute;
  left: 24px;
  top: 50%;
  transform: translateY(-50%);
  background: var(--color-surface, #fff);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 8px;
  padding: 10px;
  z-index: 100;
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  min-width: 180px;
}
.ampel-popup-colors { display: flex; gap: 10px; margin-bottom: 8px; }
.ampel-popup-reasons { display: flex; flex-direction: column; gap: 6px; }
.ampel-reason-label { display: flex; align-items: center; gap: 6px; font-size: 0.8rem; cursor: pointer; }
.ampel-reason-confirm {
  margin-top: 4px;
  padding: 4px 12px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  align-self: flex-start;
}
```

- [ ] **Step 7: Test in browser**

```bash
npm run dev
```

Verify: green/yellow/red dot appears in list. Click dot → popup opens. Select green/yellow → closes immediately. Click red → shows reason sub-menu → select reason + confirm → dot turns red.

- [ ] **Step 8: Commit**

```bash
git add src/App.vue
git commit -m "feat(list): Ampel dot column with mini-popup for quick outreach status change"
```

---

## Task 6: App.vue — 3-Dot Menu + File System Access

**Files:**
- Modify: `src/App.vue`

- [ ] **Step 1: Import useFileSave**

Add to the script setup imports:
```typescript
import { useFileSave, isFileSystemAccessSupported } from './composables/useFileSave'
```

And destructure:
```typescript
const { hasSaveFile, saveFileName, isDirty, init: initFileSave, pickSaveFile, saveToFile, loadFromFile } = useFileSave()
```

- [ ] **Step 2: Add 3-dot menu state + init on mount**

Add after the existing refs:
```typescript
const showThreeDotMenu = ref(false)

const closeThreeDotMenu = () => { showThreeDotMenu.value = false }
```

In `onMounted`, add `initFileSave()` call:
```typescript
  initFileSave()
```

Also add close-on-outside-click for the 3-dot menu in the document click handler (alongside the ampel popup close):
```typescript
  const handleOutsideClick = () => {
    closeAmpelPopup()
    closeThreeDotMenu()
  }
```

- [ ] **Step 3: Add dirty tracking**

After the companies watch (line ~102 in App.vue), add:
```typescript
watch(companies, () => {
  isDirty.value = true
})
```

- [ ] **Step 4: Add save/load handlers**

```typescript
const handlePickSaveFile = async () => {
  closeThreeDotMenu()
  await pickSaveFile(exportCompaniesJson())
}

const handleSaveToFile = async () => {
  closeThreeDotMenu()
  const ok = await saveToFile(exportCompaniesJson())
  if (!ok) window.alert('Speichern fehlgeschlagen. Bitte Speicherort neu wählen.')
}

const handleLoadFromFile = async () => {
  closeThreeDotMenu()
  const raw = await loadFromFile()
  if (!raw) return
  const imported = importCompaniesFromJson(raw)
  if (!imported.length) {
    window.alert('Laden fehlgeschlagen: keine gültigen Daten gefunden.')
    return
  }
  const confirmed = window.confirm(`${imported.length} Einträge laden und aktuellen Stand ersetzen?`)
  if (confirmed) mergeImportedCompanies(imported)
}
```

- [ ] **Step 5: Replace Export/Import buttons in template with 3-dot menu**

In the `<div class="topbar-actions">`, replace:
```html
        <button type="button" class="ghost" @click="exportData">Export</button>
        <button type="button" class="ghost" @click="openImport">Import</button>
        <input ref="importInput" type="file" accept="application/json" class="hidden-input" @change="importData" />
```

With:
```html
        <div style="position:relative;">
          <button
            type="button"
            class="ghost"
            :class="{ 'dirty-indicator': isDirty && hasSaveFile }"
            @click.stop="showThreeDotMenu = !showThreeDotMenu"
            title="Datei-Optionen"
          >
            ···
          </button>
          <div v-if="showThreeDotMenu" class="three-dot-menu" @click.stop>
            <template v-if="isFileSystemAccessSupported()">
              <button v-if="!hasSaveFile" type="button" class="menu-item" @click="handlePickSaveFile">
                💾 Speicherort wählen
              </button>
              <template v-else>
                <button type="button" class="menu-item" @click="handleSaveToFile">
                  💾 Speichern{{ isDirty ? ' *' : '' }} <span class="menu-sub">{{ saveFileName }}</span>
                </button>
                <button type="button" class="menu-item" @click="handlePickSaveFile">
                  📁 Speicherort ändern
                </button>
              </template>
              <button type="button" class="menu-item" @click="handleLoadFromFile">
                📂 Laden
              </button>
              <div class="menu-divider" />
            </template>
            <button type="button" class="menu-item" @click="exportData(); closeThreeDotMenu()">
              ⬇ Daten exportieren
            </button>
            <button type="button" class="menu-item" @click="openImport(); closeThreeDotMenu()">
              ⬆ Daten importieren
            </button>
          </div>
        </div>
        <input ref="importInput" type="file" accept="application/json" class="hidden-input" @change="importData" />
```

- [ ] **Step 6: Add save reminder banner below topbar**

After the `</header>` closing tag and before `<section class="controls">`, add:

```html
    <div v-if="!hasSaveFile" class="save-reminder">
      💡 Tipp: Klicke auf <strong>···</strong> → <strong>Speicherort wählen</strong>, um deine Daten nach jeder Sitzung sicher zu speichern.
    </div>
    <div v-else-if="isDirty" class="save-reminder save-reminder--dirty">
      Ungespeicherte Änderungen — klicke <strong>···</strong> → <strong>Speichern</strong> vor dem Schließen.
    </div>
```

- [ ] **Step 7: Add styles**

```css
.three-dot-menu {
  position: absolute;
  right: 0;
  top: calc(100% + 4px);
  background: var(--color-surface, #fff);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 8px;
  padding: 6px;
  z-index: 200;
  min-width: 200px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
}
.menu-item {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 8px 10px;
  background: none;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  text-align: left;
  color: inherit;
}
.menu-item:hover { background: var(--color-surface-hover, #f5f5f5); }
.menu-sub { font-size: 0.75rem; color: #888; margin-left: auto; max-width: 80px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.menu-divider { height: 1px; background: var(--color-border, #e5e7eb); margin: 4px 0; }
.dirty-indicator { position: relative; }
.dirty-indicator::after { content: ''; position: absolute; top: 4px; right: 4px; width: 6px; height: 6px; background: #f97316; border-radius: 50%; }
.save-reminder {
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 6px;
  padding: 8px 14px;
  font-size: 0.8rem;
  color: #92400e;
  margin-bottom: 8px;
}
.save-reminder--dirty {
  background: #fff7ed;
  border-color: #fed7aa;
  color: #9a3412;
}
```

- [ ] **Step 8: Test in browser**

Open http://localhost:5173. Verify:
- `···` button appears in header
- Menu opens on click, closes on outside click
- "Speicherort wählen" opens native file picker (Chrome only)
- After picking: shows "Speichern" option with filename
- Orange dot on `···` button when unsaved changes exist

- [ ] **Step 9: Commit**

```bash
git add src/App.vue src/composables/useFileSave.ts
git commit -m "feat(save): 3-dot menu with File System Access API + save reminder banner"
```

---

## Task 7: App.vue — Update Banner + What's New Modal

**Files:**
- Modify: `src/App.vue`

- [ ] **Step 1: Add version constants**

At the top of `<script setup>` (after imports), add:
```typescript
const APP_VERSION = 'v2'
const VERSION_STORAGE_KEY = 'apply-tracker.version'
```

- [ ] **Step 2: Add What's New state**

```typescript
const showWhatsNew = ref(false)
```

- [ ] **Step 3: Version check on mount**

In `onMounted`, add:
```typescript
  const storedVersion = localStorage.getItem(VERSION_STORAGE_KEY)
  if (storedVersion !== APP_VERSION) {
    showWhatsNew.value = true
    localStorage.setItem(VERSION_STORAGE_KEY, APP_VERSION)
  }
```

- [ ] **Step 4: Add What's New modal to template**

After the `<CompanyDetailModal>` component and before `</main>`, add:

```html
    <div v-if="showWhatsNew" class="overlay" @click.self="showWhatsNew = false">
      <div class="modal whats-new-modal">
        <header class="modal-header">
          <h2>Neu in v2</h2>
          <button type="button" class="ghost" @click="showWhatsNew = false">Schließen</button>
        </header>
        <div class="whats-new-body">
          <div class="whats-new-feature">
            <span class="feature-icon">🚦</span>
            <div>
              <strong>Ampelsystem</strong>
              <p>Jede Firma hat jetzt ein Erreichbarkeits-Signal (Grün / Gelb / Rot). Bei Rot kannst du den Grund hinterlegen: Kein Ausbilder, Absage generell oder Absage Kapazität. Klick auf den Dot in der Liste zum schnellen Wechseln — oder bearbeite ihn im Formular.</p>
            </div>
          </div>
          <div class="whats-new-feature">
            <span class="feature-icon">💾</span>
            <div>
              <strong>Lokales Speichern</strong>
              <p>Über das <strong>···</strong>-Menü kannst du einmalig einen Speicherort auf deinem PC wählen. Danach reicht ein Klick auf <strong>Speichern</strong> um den aktuellen Stand zu sichern — kein Datei-Dialog jedes Mal.</p>
            </div>
          </div>
          <div class="whats-new-feature">
            <span class="feature-icon">📋</span>
            <div>
              <strong>Empfehlung: Nach jeder Sitzung speichern</strong>
              <p>Der Browser-Cache kann gelöscht werden oder ein Update lädt eine neue Version. Speichere deinen Stand regelmäßig lokal um Datenverlust zu vermeiden.</p>
            </div>
          </div>
          <div class="whats-new-actions">
            <button type="button" class="primary" @click="showWhatsNew = false; showThreeDotMenu = true">
              Speicherort jetzt wählen
            </button>
            <button type="button" class="ghost" @click="showWhatsNew = false">Später</button>
          </div>
        </div>
      </div>
    </div>
```

- [ ] **Step 5: Add styles**

```css
.whats-new-modal { max-width: 520px; }
.whats-new-body { padding: 0 0 8px; display: flex; flex-direction: column; gap: 16px; }
.whats-new-feature { display: flex; gap: 12px; align-items: flex-start; }
.feature-icon { font-size: 1.5rem; flex-shrink: 0; margin-top: 2px; }
.whats-new-feature strong { display: block; margin-bottom: 4px; }
.whats-new-feature p { margin: 0; font-size: 0.875rem; color: var(--color-text-muted, #555); line-height: 1.5; }
.whats-new-actions { display: flex; gap: 8px; padding-top: 8px; }
```

- [ ] **Step 6: Final browser test**

Clear `apply-tracker.version` from localStorage (DevTools → Application → Storage → localStorage → delete that key), reload.

Expected:
1. "Neu in v2"-Modal erscheint
2. "Speicherort jetzt wählen" öffnet das 3-dot-Menü nach Modal-Schließung
3. Alle bestehenden Daten noch vorhanden (outreachStatus = 'yellow' für alle)
4. Ampel-Dots in der Listenansicht sichtbar

- [ ] **Step 7: Final commit**

```bash
git add src/App.vue
git commit -m "feat(ux): What's New v2 modal + version detection on mount"
```

---

## Self-Review Checklist

- [x] **Spec coverage:** Ampelsystem ✓, Rot-Gründe im Ampel-System ✓, 3-Dot-Menü ✓, File System Access ✓, Speicher-Reminder ✓, Update-Banner/Modal ✓
- [x] **No placeholders:** alle Code-Blöcke vollständig
- [x] **Type consistency:** `OutreachStatus`, `RedReason`, `RED_REASON_LABELS` konsistent durch alle Tasks verwendet; `updateCompanyOutreach(id, outreachStatus, redReason?)` Signatur ist gleich in Task 2 (Definition) und Tasks 5/6 (Verwendung)
- [x] **Migration:** `toCompany()` setzt `outreachStatus: 'yellow'` und `redReason: undefined` als Default → bestehende Daten in v1-localStorage werden automatisch korrekt geladen
