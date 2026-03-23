<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import CompanyDetailModal from './components/CompanyDetailModal.vue'
import CompanyFormModal from './components/CompanyFormModal.vue'
import CompareModal from './components/CompareModal.vue'
import CalendarTab from './components/CalendarTab.vue'
import StatsDashboard from './components/StatsDashboard.vue'
import JobSearchTab from './components/JobSearchTab.vue'
import { useCompanies } from './composables/useCompanies'
import { STATUSES, PRIORITIES, type Company, type CompanyInput, type CompanyRating, type CompanyStatus, type Priority } from './types/company'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

type Theme = 'light' | 'dark'
type ViewMode = 'list' | 'kanban' | 'swimlane'
type FollowUpFilter = 'All' | 'Due' | 'Overdue' | 'None'
type SortOption = 'updated-desc' | 'follow-up-asc' | 'company-name' | 'priority' | 'deadline-asc'

type Tab = 'tracker' | 'stats' | 'jobs' | 'calendar'

const STATUS_LABELS: Record<CompanyStatus, string> = {
  Interested: 'Interessiert',
  Applied: 'Beworben',
  Interviewing: 'Im Gespräch',
  Offer: 'Angebot',
  Rejected: 'Absage',
  Archived: 'Archiv',
}

const PRIORITY_LABELS: Record<Priority, string> = {
  High: 'Hoch',
  Medium: 'Mittel',
  Low: 'Niedrig',
}

const PRIORITY_CLASS: Record<Priority, string> = {
  High: 'priority-badge priority-high',
  Medium: 'priority-badge priority-medium',
  Low: 'priority-badge priority-low',
}

const PRIORITY_ORDER: Record<Priority, number> = { High: 0, Medium: 1, Low: 2 }

const THEME_STORAGE_KEY = 'apply-tracker.theme.v1'
const COMPANY_STORAGE_KEY = 'apply-tracker.companies.v1'
const COLLAPSED_COLUMNS_KEY = 'apply-tracker.collapsed-columns.v1'
const SEED_URL = '/bewerbungstracker-import.json'

const {
  companies,
  addCompany,
  updateCompany,
  updateCompanyStatus,
  updateStatusAndPriority,
  updateRating,
  deleteCompany,
  addActivityEntry,
  importCompaniesFromJson,
  mergeImportedCompanies,
  exportCompaniesJson,
} = useCompanies()

const searchText = ref('')
const selectedStatus = ref<CompanyStatus | 'All'>('All')
const selectedTag = ref<'All' | string>('All')
const selectedFollowUp = ref<FollowUpFilter>('All')
const selectedPriority = ref<Priority | 'All'>('All')
const sortBy = ref<SortOption>('updated-desc')
const viewMode = ref<ViewMode>('list')
const activeTab = ref<Tab>('tracker')

const showFormModal = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const editingCompany = ref<Company | undefined>(undefined)
const formPreset = ref<Partial<CompanyInput> | undefined>(undefined)

const showDetailModal = ref(false)
const selectedCompany = ref<Company | undefined>(undefined)

const draggedCompanyId = ref<string | null>(null)
const dragOverStatus = ref<CompanyStatus | null>(null)
const importInput = ref<HTMLInputElement | null>(null)

// Kanban top scrollbar mirror
const kanbanWrapEl = ref<HTMLElement | null>(null)
const kanbanTopBarEl = ref<HTMLElement | null>(null)
const kanbanScrollWidth = ref(0)
let scrollSyncing = false

const syncTop = () => {
  if (scrollSyncing || !kanbanTopBarEl.value || !kanbanWrapEl.value) return
  scrollSyncing = true
  kanbanTopBarEl.value.scrollLeft = kanbanWrapEl.value.scrollLeft
  scrollSyncing = false
}

const syncWrap = () => {
  if (scrollSyncing || !kanbanWrapEl.value || !kanbanTopBarEl.value) return
  scrollSyncing = true
  kanbanWrapEl.value.scrollLeft = kanbanTopBarEl.value.scrollLeft
  scrollSyncing = false
}

const refreshKanbanScrollWidth = async () => {
  await nextTick()
  if (kanbanWrapEl.value) {
    kanbanScrollWidth.value = kanbanWrapEl.value.scrollWidth
  }
}

const storedCollapsed = localStorage.getItem(COLLAPSED_COLUMNS_KEY)
const collapsedColumns = ref<Set<CompanyStatus>>(
  new Set(storedCollapsed ? (JSON.parse(storedCollapsed) as CompanyStatus[]) : []),
)

const toggleColumn = (status: CompanyStatus) => {
  const next = new Set(collapsedColumns.value)
  if (next.has(status)) {
    next.delete(status)
  } else {
    next.add(status)
  }
  collapsedColumns.value = next
  localStorage.setItem(COLLAPSED_COLUMNS_KEY, JSON.stringify([...next]))
}

const compareSelection = ref<string[]>([])
const showCompareModal = ref(false)
const compareList = computed(() =>
  compareSelection.value
    .map((id) => companies.value.find((c) => c.id === id))
    .filter((c): c is Company => c !== undefined),
)

const toggleCompare = (id: string) => {
  const idx = compareSelection.value.indexOf(id)
  if (idx === -1) {
    if (compareSelection.value.length < 3) compareSelection.value = [...compareSelection.value, id]
  } else {
    compareSelection.value = compareSelection.value.filter((x) => x !== id)
  }
}

const systemTheme = ref<Theme>('light')
const themePreference = ref<Theme | null>(null)
const activeTheme = computed<Theme>(() => themePreference.value ?? systemTheme.value)
let removeThemeListener: (() => void) | undefined

const notificationPermission = ref<NotificationPermission>(
  typeof Notification !== 'undefined' ? Notification.permission : 'default',
)

const installPrompt = ref<BeforeInstallPromptEvent | null>(null)
const isInstalled = ref(window.matchMedia('(display-mode: standalone)').matches)

const installApp = async () => {
  if (!installPrompt.value) return
  await installPrompt.value.prompt()
  const { outcome } = await installPrompt.value.userChoice
  if (outcome === 'accepted') {
    installPrompt.value = null
    isInstalled.value = true
  }
}

const setThemePreference = (theme: Theme) => {
  themePreference.value = theme
  localStorage.setItem(THEME_STORAGE_KEY, theme)
}

const getTodayLocalIsoDate = () => {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 10)
}

const getFollowUpState = (company: Company): FollowUpFilter => {
  const date = company.nextFollowUpDate
  if (!date) {
    return 'None'
  }
  const today = getTodayLocalIsoDate()
  if (date < today) {
    return 'Overdue'
  }
  return 'Due'
}

const isOverdue = (company: Company) => getFollowUpState(company) === 'Overdue'

const urgentCount = computed(() => {
  const today = getTodayLocalIsoDate()
  const in3 = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10)
  let count = 0
  for (const c of companies.value) {
    if (c.nextFollowUpDate && c.nextFollowUpDate < today) count++
    else if (c.applicationDeadline && c.applicationDeadline >= today && c.applicationDeadline <= in3) count++
  }
  return count
})

const triggerNotifications = () => {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
  const today = getTodayLocalIsoDate()
  const in3 = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10)

  const overdueItems = companies.value.filter((c) => c.nextFollowUpDate && c.nextFollowUpDate < today)
  const deadlineItems = companies.value.filter(
    (c) => c.applicationDeadline && c.applicationDeadline >= today && c.applicationDeadline <= in3,
  )

  if (overdueItems.length > 0) {
    new Notification('Bewerbungs-Tracker', {
      body: `${overdueItems.length} überfällige Follow-up(s)`,
      icon: '/favicon.ico',
    })
  }
  if (deadlineItems.length > 0) {
    new Notification('Bewerbungs-Tracker', {
      body: `${deadlineItems.length} Deadline(s) in den nächsten 3 Tagen`,
      icon: '/favicon.ico',
    })
  }
}

const enableNotifications = async () => {
  if (typeof Notification === 'undefined') return
  const result = await Notification.requestPermission()
  notificationPermission.value = result
  if (result === 'granted') {
    triggerNotifications()
  }
}

const seedInitialData = async () => {
  if (localStorage.getItem(COMPANY_STORAGE_KEY)) {
    return
  }

  try {
    const response = await fetch(SEED_URL)
    if (!response.ok) {
      return
    }

    const raw = await response.text()
    const imported = importCompaniesFromJson(raw)
    if (!imported.length) {
      return
    }

    mergeImportedCompanies(imported)
  } catch {
    // ignore
  }
}

onMounted(async () => {
  const handleInstallPrompt = (e: Event) => {
    e.preventDefault()
    installPrompt.value = e as BeforeInstallPromptEvent
  }
  window.addEventListener('beforeinstallprompt', handleInstallPrompt)
  window.addEventListener('appinstalled', () => {
    installPrompt.value = null
    isInstalled.value = true
  })

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  systemTheme.value = mediaQuery.matches ? 'dark' : 'light'

  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY)
  if (storedTheme === 'light' || storedTheme === 'dark') {
    themePreference.value = storedTheme
  }

  const handleSystemThemeChange = (event: MediaQueryListEvent) => {
    systemTheme.value = event.matches ? 'dark' : 'light'
  }

  mediaQuery.addEventListener('change', handleSystemThemeChange)
  removeThemeListener = () => mediaQuery.removeEventListener('change', handleSystemThemeChange)

  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    triggerNotifications()
  }

  await seedInitialData()
})

onUnmounted(() => {
  removeThemeListener?.()
})

watch(
  activeTheme,
  (theme) => {
    document.documentElement.dataset.theme = theme
  },
  { immediate: true },
)

watch(companies, (list) => {
  if (!selectedCompany.value) {
    return
  }
  const latest = list.find((company) => company.id === selectedCompany.value?.id)
  selectedCompany.value = latest
})

watch([viewMode, activeTab, collapsedColumns], () => {
  if (activeTab.value === 'tracker' && viewMode.value !== 'list') {
    refreshKanbanScrollWidth()
  }
})

const availableTags = computed(() => {
  const tags = new Set<string>()
  for (const company of companies.value) {
    company.tags.forEach((tag) => tags.add(tag))
  }

  return [...tags].sort((a, b) => a.localeCompare(b))
})

const filteredAndSortedCompanies = computed(() => {
  const query = searchText.value.trim().toLowerCase()

  const filtered = companies.value.filter((company) => {
    const matchesSearch =
      query.length === 0 ||
      company.name.toLowerCase().includes(query) ||
      company.role.toLowerCase().includes(query) ||
      company.location.toLowerCase().includes(query)

    const matchesStatus = selectedStatus.value === 'All' || company.status === selectedStatus.value
    const matchesTag = selectedTag.value === 'All' || company.tags.includes(selectedTag.value)
    const followUpState = getFollowUpState(company)
    const matchesFollowUp = selectedFollowUp.value === 'All' || followUpState === selectedFollowUp.value
    const matchesPriority = selectedPriority.value === 'All' || company.priority === selectedPriority.value

    return matchesSearch && matchesStatus && matchesTag && matchesFollowUp && matchesPriority
  })

  return [...filtered].sort((a, b) => {
    if (sortBy.value === 'company-name') {
      return a.name.localeCompare(b.name)
    }

    if (sortBy.value === 'follow-up-asc') {
      const aDate = a.nextFollowUpDate ?? '9999-12-31'
      const bDate = b.nextFollowUpDate ?? '9999-12-31'
      if (aDate === bDate) {
        return a.name.localeCompare(b.name)
      }
      return aDate.localeCompare(bDate)
    }

    if (sortBy.value === 'priority') {
      const diff = (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1)
      if (diff !== 0) return diff
      return a.name.localeCompare(b.name)
    }

    if (sortBy.value === 'deadline-asc') {
      const aD = a.applicationDeadline ?? '9999-12-31'
      const bD = b.applicationDeadline ?? '9999-12-31'
      if (aD === bD) return a.name.localeCompare(b.name)
      return aD.localeCompare(bD)
    }

    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })
})

const kanbanColumns = computed(() => {
  return STATUSES.map((status) => ({
    status,
    items: filteredAndSortedCompanies.value.filter((company) => company.status === status),
  }))
})

const swimlaneRows = computed(() =>
  PRIORITIES.map((priority) => ({
    priority,
    total: filteredAndSortedCompanies.value.filter((c) => c.priority === priority).length,
    columns: STATUSES.map((status) => ({
      status,
      items: filteredAndSortedCompanies.value.filter(
        (c) => c.priority === priority && c.status === status,
      ),
    })),
  })),
)

const openCreateModal = () => {
  formMode.value = 'create'
  editingCompany.value = undefined
  formPreset.value = undefined
  showFormModal.value = true
}

const openCreateModalWithPreset = (preset: Partial<CompanyInput>) => {
  formMode.value = 'create'
  editingCompany.value = undefined
  formPreset.value = preset
  showFormModal.value = true
}

const openEditModal = (company: Company) => {
  showDetailModal.value = false
  formMode.value = 'edit'
  editingCompany.value = company
  formPreset.value = undefined
  showFormModal.value = true
}

const openDetailModal = (company: Company) => {
  selectedCompany.value = company
  showDetailModal.value = true
}

const saveCompany = (input: CompanyInput) => {
  if (formMode.value === 'create') {
    addCompany(input)
    return
  }

  if (!editingCompany.value) {
    return
  }

  updateCompany(editingCompany.value.id, input)
}

const removeCompany = () => {
  if (!selectedCompany.value) {
    return
  }

  const confirmed = window.confirm(`${selectedCompany.value.name} wirklich löschen?`)
  if (!confirmed) {
    return
  }

  deleteCompany(selectedCompany.value.id)
  showDetailModal.value = false
  selectedCompany.value = undefined
}

const handleAddActivity = (note: string) => {
  if (!selectedCompany.value) return
  addActivityEntry(selectedCompany.value.id, note)
}

const handleUpdateRating = (rating: CompanyRating) => {
  if (!selectedCompany.value) return
  updateRating(selectedCompany.value.id, rating)
}

const escapeHtml = (str: string): string =>
  str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const generatePrintHtml = (list: Company[]): string => {
  const date = new Date().toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' })

  const statusColors: Record<CompanyStatus, string> = {
    Interested: '#dbeafe', Applied: '#ede9fe', Interviewing: '#fef3c7',
    Offer: '#d1fae5', Rejected: '#fee2e2', Archived: '#f3f4f6',
  }
  const priorityColors: Record<Priority, string> = {
    High: '#fee2e2', Medium: '#fef3c7', Low: '#d1fae5',
  }

  const statsLine = STATUSES
    .map((s) => ({ label: STATUS_LABELS[s], count: list.filter((c) => c.status === s).length }))
    .filter((s) => s.count > 0)
    .map((s) => `<span class="stat">${s.label}: <strong>${s.count}</strong></span>`)
    .join('')

  const rows = list.map((c) => `
    <tr>
      <td><strong>${escapeHtml(c.name)}</strong>${c.url ? `<br><a href="${escapeHtml(c.url)}">${escapeHtml(c.url)}</a>` : ''}</td>
      <td>${escapeHtml(c.role || '—')}</td>
      <td>${escapeHtml(c.location || '—')}</td>
      <td><span class="badge" style="background:${statusColors[c.status]}">${STATUS_LABELS[c.status]}</span></td>
      <td><span class="badge" style="background:${priorityColors[c.priority]}">${PRIORITY_LABELS[c.priority]}</span></td>
      <td>${escapeHtml(c.applicationDeadline || '—')}</td>
      <td>${escapeHtml(c.nextFollowUpDate || '—')}</td>
      <td>${escapeHtml(c.notes ? c.notes.slice(0, 80) + (c.notes.length > 80 ? '…' : '') : '—')}</td>
    </tr>`).join('')

  return `<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8">
<title>Bewerbungsübersicht</title>
<style>
  *{box-sizing:border-box}
  body{font-family:"Segoe UI",Arial,sans-serif;font-size:11px;color:#1f2a37;margin:0;padding:20px}
  h1{font-size:18px;margin:0 0 3px}
  .sub{color:#6b7280;font-size:10px;margin-bottom:14px}
  .stats{display:flex;flex-wrap:wrap;gap:8px 16px;margin-bottom:16px;padding:10px 14px;background:#f8fafc;border-radius:6px;border:1px solid #e2e8f0}
  .stat{font-size:10px;color:#374151}
  table{width:100%;border-collapse:collapse}
  th{background:#f1f5f9;text-align:left;padding:7px 9px;font-size:10px;font-weight:600;border-bottom:2px solid #e2e8f0}
  td{padding:6px 9px;border-bottom:1px solid #f1f5f9;vertical-align:top;font-size:10px}
  tr:nth-child(even) td{background:#fafbfc}
  .badge{padding:2px 7px;border-radius:999px;font-size:9px;font-weight:600;display:inline-block}
  a{color:#0f5cc0;font-size:9px}
  @media print{body{padding:0}@page{margin:12mm;size:A4 landscape}}
</style></head><body>
  <h1>Bewerbungsübersicht</h1>
  <p class="sub">Exportiert am ${date} &middot; ${list.length} Eintr&auml;ge</p>
  <div class="stats">${statsLine}</div>
  <table><thead><tr>
    <th>Firma</th><th>Stelle</th><th>Ort</th><th>Status</th>
    <th>Priorit&auml;t</th><th>Deadline</th><th>Follow-up</th><th>Notizen</th>
  </tr></thead><tbody>${rows}</tbody></table>
</body></html>`
}

const exportPdf = () => {
  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(generatePrintHtml(companies.value))
  win.document.close()
  win.focus()
  setTimeout(() => win.print(), 300)
}

const exportData = () => {
  const content = exportCompaniesJson()
  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  link.href = url
  link.download = `company-tracker-${stamp}.json`
  link.click()
  URL.revokeObjectURL(url)
}

const openImport = () => {
  importInput.value?.click()
}

const importData = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) {
    return
  }

  try {
    const raw = await file.text()
    const imported = importCompaniesFromJson(raw)

    if (!imported.length) {
      window.alert('Import fehlgeschlagen: In der ausgewählten JSON-Datei wurden keine gültigen Einträge gefunden.')
      return
    }

    const existingIds = new Set(companies.value.map((company) => company.id))
    const overwriteCount = imported.filter((company) => existingIds.has(company.id)).length
    const newCount = imported.length - overwriteCount

    const confirmed = window.confirm(
      `Import von ${imported.length} Einträgen starten?\n\n` +
        `- Neu: ${newCount}\n` +
        `- Überschreiben (gleiche ID): ${overwriteCount}\n\n` +
        'Importierte Einträge werden per ID zusammengeführt. Import-Werte überschreiben vorhandene Daten.',
    )

    if (!confirmed) {
      return
    }

    mergeImportedCompanies(imported)
    window.alert(`Import abgeschlossen. Neu: ${newCount}, überschrieben: ${overwriteCount}.`)
  } catch {
    window.alert('Import fehlgeschlagen: Datei konnte nicht gelesen werden.')
  } finally {
    input.value = ''
  }
}

const onDragStart = (companyId: string) => {
  draggedCompanyId.value = companyId
}

const onDragOver = (status: CompanyStatus) => {
  dragOverStatus.value = status
}

const onDragLeave = () => {
  dragOverStatus.value = null
}

const onDropToStatus = (status: CompanyStatus) => {
  dragOverStatus.value = null
  if (!draggedCompanyId.value) {
    return
  }

  const company = companies.value.find((item) => item.id === draggedCompanyId.value)
  if (company && company.status !== status) {
    updateCompanyStatus(company.id, status)
  }

  draggedCompanyId.value = null
}

const clearDragged = () => {
  draggedCompanyId.value = null
  dragOverStatus.value = null
}

// ── Swimlane drag-and-drop ───────────────────────────────────
type SwimlaneCell = { status: CompanyStatus; priority: Priority }

const swimlaneDraggedId = ref<string | null>(null)
const swimlaneDragOver = ref<SwimlaneCell | null>(null)

const onSwimlaneDragStart = (companyId: string) => {
  swimlaneDraggedId.value = companyId
}

const onSwimlaneDragEnter = (cell: SwimlaneCell) => {
  swimlaneDragOver.value = cell
}

const onSwimlaneDrop = (cell: SwimlaneCell) => {
  swimlaneDragOver.value = null
  if (!swimlaneDraggedId.value) return

  const company = companies.value.find((c) => c.id === swimlaneDraggedId.value)
  if (company && (company.status !== cell.status || company.priority !== cell.priority)) {
    updateStatusAndPriority(company.id, cell.status, cell.priority)
  }

  swimlaneDraggedId.value = null
}

const onSwimlaneDragEnd = () => {
  swimlaneDraggedId.value = null
  swimlaneDragOver.value = null
}

const isSwimlaneOver = (cell: SwimlaneCell) =>
  swimlaneDragOver.value?.status === cell.status &&
  swimlaneDragOver.value?.priority === cell.priority
</script>

<template>
  <main class="container">
    <header class="topbar">
      <div>
        <h1>Bewerbungs-Tracker</h1>
        <p>Behalte Bewerbungen, Gespräche und Follow-ups an einem Ort im Blick.</p>
      </div>
      <div class="topbar-actions">
        <div class="view-toggle" role="group" aria-label="Tabs">
          <button
            type="button"
            class="toggle-btn"
            :class="{ active: activeTab === 'tracker' }"
            @click="activeTab = 'tracker'"
          >
            Tracker
          </button>
          <button
            type="button"
            class="toggle-btn"
            :class="{ active: activeTab === 'stats' }"
            @click="activeTab = 'stats'"
          >
            Statistiken
          </button>
          <button
            type="button"
            class="toggle-btn"
            :class="{ active: activeTab === 'jobs' }"
            @click="activeTab = 'jobs'"
          >
            Stellen
          </button>
          <button
            type="button"
            class="toggle-btn"
            :class="{ active: activeTab === 'calendar' }"
            @click="activeTab = 'calendar'"
          >
            Kalender
          </button>
        </div>
        <div class="theme-toggle" role="group" aria-label="Theme selection">
          <button
            type="button"
            class="toggle-btn"
            :class="{ active: activeTheme === 'light' }"
            @click="setThemePreference('light')"
          >
            Hell
          </button>
          <button
            type="button"
            class="toggle-btn"
            :class="{ active: activeTheme === 'dark' }"
            @click="setThemePreference('dark')"
          >
            Dunkel
          </button>
        </div>
        <button
          type="button"
          class="ghost notification-btn"
          :title="notificationPermission === 'granted' ? 'Benachrichtigungen aktiv' : 'Benachrichtigungen aktivieren'"
          @click="notificationPermission === 'granted' ? triggerNotifications() : enableNotifications()"
        >
          🔔
          <span v-if="urgentCount > 0" class="notification-badge">{{ urgentCount }}</span>
        </button>
        <button
          v-if="installPrompt && !isInstalled"
          type="button"
          class="ghost install-btn"
          title="App installieren – funktioniert auch offline"
          @click="installApp"
        >⬇ Installieren</button>
        <button type="button" class="ghost" @click="exportPdf">PDF</button>
        <button type="button" class="ghost" @click="exportData">Export</button>
        <button type="button" class="ghost" @click="openImport">Import</button>
        <input ref="importInput" type="file" accept="application/json" class="hidden-input" @change="importData" />
        <button type="button" class="primary" @click="openCreateModal">+ Bewerbung</button>
      </div>
    </header>

    <section v-if="activeTab === 'tracker'" class="controls">
      <input v-model="searchText" placeholder="Suche nach Firma, Stelle oder Ort" aria-label="Suche" />
      <select v-model="selectedStatus">
        <option value="All">Alle Status</option>
        <option v-for="status in STATUSES" :key="status" :value="status">{{ STATUS_LABELS[status] }}</option>
      </select>
      <select v-model="selectedTag">
        <option value="All">Alle Tags</option>
        <option v-for="tag in availableTags" :key="tag" :value="tag">{{ tag }}</option>
      </select>
      <select v-model="selectedFollowUp">
        <option value="All">Follow-up: Alle</option>
        <option value="Due">Follow-up: Fällig</option>
        <option value="Overdue">Follow-up: Überfällig</option>
        <option value="None">Follow-up: Keins</option>
      </select>
      <select v-model="selectedPriority">
        <option value="All">Priorität: Alle</option>
        <option v-for="p in PRIORITIES" :key="p" :value="p">{{ PRIORITY_LABELS[p] }}</option>
      </select>
      <select v-model="sortBy">
        <option value="updated-desc">Sortierung: Zuletzt aktualisiert</option>
        <option value="follow-up-asc">Sortierung: Follow-up Datum</option>
        <option value="company-name">Sortierung: Firmenname</option>
        <option value="priority">Sortierung: Priorität</option>
        <option value="deadline-asc">Sortierung: Deadline</option>
      </select>
      <div class="view-toggle" role="group" aria-label="View mode">
        <button type="button" class="toggle-btn" :class="{ active: viewMode === 'list' }" @click="viewMode = 'list'">
          Liste
        </button>
        <button
          type="button"
          class="toggle-btn"
          :class="{ active: viewMode === 'kanban' }"
          @click="viewMode = 'kanban'"
        >
          Kanban
        </button>
        <button
          type="button"
          class="toggle-btn"
          :class="{ active: viewMode === 'swimlane' }"
          @click="viewMode = 'swimlane'"
        >
          Swimlane
        </button>
      </div>
    </section>

    <section v-if="activeTab === 'stats'">
      <StatsDashboard :companies="companies" />
    </section>

    <section v-else-if="activeTab === 'tracker' && filteredAndSortedCompanies.length && viewMode === 'list'" class="table-wrap">
      <table>
        <thead>
          <tr>
            <th class="compare-col" title="Für Vergleich auswählen">Vgl.</th>
            <th>Firma</th>
            <th>Stelle</th>
            <th>Ort</th>
            <th>Status</th>
            <th>Priorität</th>
            <th>Tags</th>
            <th>Deadline</th>
            <th>Follow-up</th>
            <th>Aktionen</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="company in filteredAndSortedCompanies"
            :key="company.id"
            :class="{ 'row-overdue': isOverdue(company) }"
          >
            <td class="compare-col">
              <input
                type="checkbox"
                :checked="compareSelection.includes(company.id)"
                :disabled="!compareSelection.includes(company.id) && compareSelection.length >= 3"
                :aria-label="`${company.name} für Vergleich auswählen`"
                @change="toggleCompare(company.id)"
              />
            </td>
            <td>
              <button type="button" class="link-btn" @click="openDetailModal(company)">{{ company.name }}</button>
            </td>
            <td>{{ company.role || '-' }}</td>
            <td>{{ company.location || '-' }}</td>
            <td>
              <select
                :value="company.status"
                class="status-select"
                :data-status="company.status"
                :aria-label="`Status für ${company.name}`"
                @change="updateCompanyStatus(company.id, ($event.target as HTMLSelectElement).value as CompanyStatus)"
              >
                <option v-for="s in STATUSES" :key="s" :value="s">{{ STATUS_LABELS[s] }}</option>
              </select>
            </td>
            <td><span :class="PRIORITY_CLASS[company.priority]">{{ PRIORITY_LABELS[company.priority] }}</span></td>
            <td>
              <div class="tag-list">
                <span v-for="tag in company.tags" :key="tag" class="tag">{{ tag }}</span>
              </div>
            </td>
            <td>
              <span
                v-if="company.applicationDeadline"
                :class="{ 'deadline-near': company.applicationDeadline <= new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10) }"
              >{{ company.applicationDeadline }}</span>
              <span v-else class="text-muted">—</span>
            </td>
            <td>{{ company.nextFollowUpDate || '—' }}</td>
            <td>
              <button type="button" class="ghost" @click="openDetailModal(company)">Details</button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <template v-else-if="activeTab === 'tracker' && filteredAndSortedCompanies.length && viewMode !== 'list'">
    <div
      ref="kanbanTopBarEl"
      class="kanban-top-scrollbar"
      @scroll.passive="syncWrap"
    >
      <div :style="{ width: kanbanScrollWidth + 'px', height: '1px' }"></div>
    </div>

    <!-- Kanban -->
    <section v-if="viewMode === 'kanban'" ref="kanbanWrapEl" class="kanban-wrap" @scroll.passive="syncTop">
      <article
        v-for="column in kanbanColumns"
        :key="column.status"
        class="kanban-column"
        :data-status="column.status"
        :class="{
          'kanban-column--drag-over': dragOverStatus === column.status,
          'kanban-column--collapsed': collapsedColumns.has(column.status),
        }"
        @dragover.prevent="onDragOver(column.status)"
        @dragleave="onDragLeave"
        @drop="onDropToStatus(column.status)"
      >
        <!-- Expanded header -->
        <header v-if="!collapsedColumns.has(column.status)" class="kanban-column-header">
          <h3>{{ STATUS_LABELS[column.status] }}</h3>
          <div class="kanban-column-header-right">
            <span class="kanban-count">{{ column.items.length }}</span>
            <button
              type="button"
              class="kanban-collapse-btn"
              :aria-label="`${STATUS_LABELS[column.status]} einklappen`"
              @click.stop="toggleColumn(column.status)"
            >‹</button>
            <button
              type="button"
              class="kanban-add-btn"
              :aria-label="`${STATUS_LABELS[column.status]} hinzufügen`"
              @click.stop="openCreateModalWithPreset({ status: column.status })"
            >+</button>
          </div>
        </header>

        <!-- Collapsed header -->
        <header
          v-else
          class="kanban-column-header kanban-column-header--collapsed"
          :title="`${STATUS_LABELS[column.status]} ausklappen`"
          @click="toggleColumn(column.status)"
        >
          <button
            type="button"
            class="kanban-collapse-btn"
            :aria-label="`${STATUS_LABELS[column.status]} ausklappen`"
            @click.stop="toggleColumn(column.status)"
          >›</button>
          <span class="kanban-collapsed-title">{{ STATUS_LABELS[column.status] }}</span>
          <span class="kanban-count">{{ column.items.length }}</span>
        </header>

        <div v-show="!collapsedColumns.has(column.status)" class="kanban-cards">
          <button
            v-for="company in column.items"
            :key="company.id"
            class="kanban-card"
            :class="{ 'card-overdue': isOverdue(company) }"
            draggable="true"
            type="button"
            @dragstart="onDragStart(company.id)"
            @dragend="clearDragged"
            @click="openDetailModal(company)"
          >
            <div class="kanban-card-top">
              <strong>{{ company.name }}</strong>
              <span :class="PRIORITY_CLASS[company.priority]">{{ PRIORITY_LABELS[company.priority] }}</span>
            </div>
            <span class="kanban-card-role">{{ company.role || '—' }}</span>
            <span v-if="company.location" class="kanban-card-location">{{ company.location }}</span>
            <span class="kanban-follow-up">Follow-up: {{ company.nextFollowUpDate || '—' }}</span>
            <div v-if="company.tags.length" class="tag-list">
              <span v-for="tag in company.tags" :key="tag" class="tag">{{ tag }}</span>
            </div>
          </button>
          <div v-if="!column.items.length" class="kanban-empty">
            <p>Keine Einträge</p>
            <button type="button" class="ghost kanban-empty-add" @click="openCreateModalWithPreset({ status: column.status })">
              + Hinzufügen
            </button>
          </div>
        </div>
      </article>
    </section>

    <!-- Swimlane -->
    <section v-else ref="kanbanWrapEl" class="swimlane-wrap" @scroll.passive="syncTop">
      <!-- Header row -->
      <div class="swimlane-header-row">
        <div class="swimlane-label-col"></div>
        <div
          v-for="status in STATUSES"
          :key="status"
          class="swimlane-status-header"
          :data-status="status"
        >{{ STATUS_LABELS[status] }}</div>
      </div>

      <!-- Priority rows -->
      <div v-for="row in swimlaneRows" :key="row.priority" class="swimlane-row">
        <div class="swimlane-label-col" :data-priority="row.priority">
          <span class="swimlane-label-text">{{ PRIORITY_LABELS[row.priority] }}</span>
          <span class="kanban-count">{{ row.total }}</span>
        </div>
        <div
          v-for="col in row.columns"
          :key="col.status"
          class="swimlane-cell"
          :class="{ 'swimlane-cell--drag-over': isSwimlaneOver({ status: col.status, priority: row.priority }) }"
          @dragover.prevent
          @dragenter.prevent="onSwimlaneDragEnter({ status: col.status, priority: row.priority })"
          @drop.prevent="onSwimlaneDrop({ status: col.status, priority: row.priority })"
        >
          <button
            v-for="company in col.items"
            :key="company.id"
            type="button"
            class="swimlane-card"
            :class="{ 'swimlane-card--overdue': isOverdue(company), 'swimlane-card--dragging': swimlaneDraggedId === company.id }"
            draggable="true"
            @dragstart="onSwimlaneDragStart(company.id)"
            @dragend="onSwimlaneDragEnd"
            @click="openDetailModal(company)"
          >
            <span class="swimlane-card-name">{{ company.name }}</span>
            <span v-if="company.role" class="swimlane-card-role">{{ company.role }}</span>
            <span
              v-if="company.applicationDeadline"
              class="swimlane-card-date"
              :class="{ 'deadline-near': company.applicationDeadline <= new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10) }"
            >⏰ {{ company.applicationDeadline }}</span>
            <span v-else-if="company.nextFollowUpDate" class="swimlane-card-date">
              ↩ {{ company.nextFollowUpDate }}
            </span>
          </button>
          <button
            type="button"
            class="swimlane-add-btn"
            :aria-label="`${PRIORITY_LABELS[row.priority]} / ${STATUS_LABELS[col.status]} hinzufügen`"
            @click="openCreateModalWithPreset({ priority: row.priority, status: col.status })"
          >+</button>
        </div>
      </div>
    </section>
    </template>

    <section v-else-if="activeTab === 'jobs'">
      <JobSearchTab @add-to-tracker="openCreateModalWithPreset" />
    </section>

    <section v-else-if="activeTab === 'calendar'">
      <CalendarTab :companies="companies" @open="openDetailModal" />
    </section>

    <section v-else-if="activeTab === 'tracker'" class="empty">
      <h2>Keine Einträge gefunden</h2>
      <p>Filter anpassen oder eine neue Bewerbung hinzufügen.</p>
    </section>

    <!-- Compare bar -->
    <Transition name="fade-slide">
      <div v-if="compareSelection.length >= 2" class="compare-bar">
        <span class="compare-bar-label">{{ compareSelection.length }} ausgewählt</span>
        <button type="button" class="primary" @click="showCompareModal = true">Vergleichen</button>
        <button type="button" class="ghost" @click="compareSelection = []">Auswahl aufheben</button>
      </div>
    </Transition>

    <CompanyFormModal
      v-model="showFormModal"
      :mode="formMode"
      :company="editingCompany"
      :preset="formPreset"
      @save="saveCompany"
    />

    <CompanyDetailModal
      v-model="showDetailModal"
      :company="selectedCompany"
      @edit="selectedCompany && openEditModal(selectedCompany)"
      @delete="removeCompany"
      @add-activity="handleAddActivity"
      @update-rating="handleUpdateRating"
    />

    <CompareModal
      v-model="showCompareModal"
      :companies="compareList"
    />
  </main>
</template>
