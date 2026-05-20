<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import CompanyDetailModal from './components/CompanyDetailModal.vue'
import CompanyFormModal from './components/CompanyFormModal.vue'
import CompareModal from './components/CompareModal.vue'
import CalendarTab from './components/CalendarTab.vue'
import StatsDashboard from './components/StatsDashboard.vue'
import JobSearchTab from './components/JobSearchTab.vue'
import HilfeTab from './components/HilfeTab.vue'
import OnboardingModal from './components/OnboardingModal.vue'
import ShareModal from './components/ShareModal.vue'
import { decodeSharePayload, type SharePayload } from './utils/share'
import { useCompanies } from './composables/useCompanies'
import { useFileSave } from './composables/useFileSave'
import { STATUSES, PRIORITIES, type Company, type CompanyInput, type CompanyRating, type CompanyStatus, type Priority } from './types/company'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

type Theme = 'light' | 'dark'
type ViewMode = 'list' | 'kanban' | 'swimlane'
type FollowUpFilter = 'All' | 'Due' | 'Overdue' | 'None'
type SortOption = 'updated-desc' | 'follow-up-asc' | 'company-name' | 'priority' | 'deadline-asc'

type Tab = 'tracker' | 'stats' | 'jobs' | 'calendar' | 'hilfe'

const STATUS_LABELS: Record<CompanyStatus, string> = {
  Interested: 'Interessiert',
  Applied: 'Beworben',
  Interviewing: 'Im Gespräch',
  Offer: 'Angebot erhalten',
  Rejected: 'Absage',
  Archived: 'Archiviert',
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
const TRAINING_TYPE_KEY = 'apply-tracker.training-type.v1'

const SEED_URLS: Record<string, string> = {
  FIAE: '/bewerbungstracker-import.json',
  FISI: '/seed-fisi.json',
  BUMA: '/seed-buma.json',
}

const {
  companies,
  storageError,
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

const {
  isSupported: fsSupported,
  activeFileName,
  hasPermission: fsHasPermission,
  isSaving: fsIsSaving,
  init: fsInit,
  chooseSaveLocation,
  saveNow,
  loadFromFile,
} = useFileSave()

// Auto-save: debounced 1 s after each data change
let autoSaveTimer: ReturnType<typeof setTimeout> | null = null

watch(
  companies,
  () => {
    if (!fsHasPermission.value) return
    if (autoSaveTimer !== null) clearTimeout(autoSaveTimer)
    autoSaveTimer = setTimeout(() => {
      autoSaveTimer = null
      void saveNow(exportCompaniesJson())
    }, 1000)
  },
  { deep: true },
)

const handleLoadFromFile = async () => {
  const raw = await loadFromFile()
  if (!raw) return
  const imported = importCompaniesFromJson(raw)
  if (!imported.length) {
    window.alert('Laden fehlgeschlagen: Keine gültigen Einträge in der Datei gefunden.')
    return
  }
  const confirmed = window.confirm(
    `${imported.length} Einträge aus der Speicherdatei laden?\n\n` +
      'Einträge werden mit den aktuellen Daten zusammengeführt (gleiche IDs werden überschrieben).',
  )
  if (!confirmed) return
  mergeImportedCompanies(imported)
}

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
const showShareModal = ref(false)
const isShareView = ref(false)
const sharePayload = ref<SharePayload | null>(null)

const showMoreMenu = ref(false)
const moreMenuEl = ref<HTMLElement | null>(null)
const showFilterPanel = ref(false)
const showCompareMode = ref(false)

const activeFilterCount = computed(() => {
  let n = 0
  if (selectedTag.value !== 'All') n++
  if (selectedFollowUp.value !== 'All') n++
  if (selectedPriority.value !== 'All') n++
  if (sortBy.value !== 'updated-desc') n++
  return n
})

const clearFilters = () => {
  selectedTag.value = 'All'
  selectedFollowUp.value = 'All'
  selectedPriority.value = 'All'
  sortBy.value = 'updated-desc'
}

const handleMoreMenuOutside = (e: MouseEvent) => {
  if (moreMenuEl.value && !moreMenuEl.value.contains(e.target as Node)) {
    showMoreMenu.value = false
  }
}

watch(showMoreMenu, (val) => {
  if (val) document.addEventListener('click', handleMoreMenuOutside)
  else document.removeEventListener('click', handleMoreMenuOutside)
})

watch(showCompareMode, (val) => {
  if (!val) compareSelection.value = []
})
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

const showOnboarding = ref(false)
const seedError = ref<string | null>(null)
const trainingType = ref<string>(localStorage.getItem(TRAINING_TYPE_KEY) ?? '')

const seedForType = async (type: string) => {
  const url = SEED_URLS[type]
  if (!url) return
  try {
    const resp = await fetch(url)
    if (!resp.ok) {
      seedError.value = 'Beispieldaten konnten nicht geladen werden (Verbindungsfehler). Du kannst trotzdem loslegen und Firmen manuell eintragen.'
      return
    }
    const imported = importCompaniesFromJson(await resp.text())
    const now = new Date().toISOString()
    const normalized = imported.map((c) => ({ ...c, createdAt: now, updatedAt: now }))
    if (normalized.length) mergeImportedCompanies(normalized)
  } catch {
    seedError.value = 'Beispieldaten konnten nicht geladen werden. Du kannst trotzdem loslegen und Firmen manuell eintragen.'
  }
}

const selectTrainingType = async (type: string) => {
  localStorage.setItem(TRAINING_TYPE_KEY, type)
  trainingType.value = type
  showOnboarding.value = false
  if (type !== 'NONE') await seedForType(type)
}

const handleResetTrainingType = () => {
  const confirmed = window.confirm(
    'Beruf-Auswahl zurücksetzen?\n\nDeine bestehenden Einträge bleiben erhalten. Du kannst danach einen neuen Beruf wählen und neue Beispieldaten laden.',
  )
  if (!confirmed) return
  localStorage.removeItem(TRAINING_TYPE_KEY)
  showOnboarding.value = true
}

const handleOnboardingKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && showOnboarding.value) {
    e.preventDefault()
    e.stopPropagation()
  }
}

onMounted(async () => {
  window.addEventListener('keydown', handleOnboardingKeydown, true)

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

  // Show onboarding only on a genuine first launch (no data and no type chosen yet).
  // Skip when a share link is present — the visitor just wants to view shared data.
  const isShareLink = window.location.hash.startsWith('#share=')
  if (!isShareLink && !localStorage.getItem(COMPANY_STORAGE_KEY) && !localStorage.getItem(TRAINING_TYPE_KEY)) {
    showOnboarding.value = true
  }

  await fsInit()

  const hash = window.location.hash
  if (hash.startsWith('#share=')) {
    try {
      const encoded = hash.slice('#share='.length)
      sharePayload.value = await decodeSharePayload(encoded)
      isShareView.value = true
      activeTab.value = 'tracker'
    } catch {
      /* invalid share link, ignore */
    }
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleOnboardingKeydown, true)
  removeThemeListener?.()
  document.removeEventListener('click', handleMoreMenuOutside)
  if (autoSaveTimer !== null) clearTimeout(autoSaveTimer)
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

const safePrintUrl = (url: string): string => {
  try {
    const p = new URL(url)
    return p.protocol === 'https:' || p.protocol === 'http:' ? escapeHtml(url) : ''
  } catch {
    return ''
  }
}

const generatePrintHtml = (list: Company[]): string => {
  const date = new Date().toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' })
  const today = getTodayLocalIsoDate()

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

  const bewerbenCount = list.filter((c) => c.status !== 'Interested' && c.status !== 'Archived').length
  const nachweisCount = list.filter((c) => c.proofSentAt).length
  const overdueCount = list.filter((c) => c.nextFollowUpDate && c.nextFollowUpDate < today).length

  const rows = list.map((c) => {
    const isOverdueRow = c.nextFollowUpDate && c.nextFollowUpDate < today
    const hasProof = c.proofSentAt || c.proofUrl
    const proofCell = hasProof
      ? `${c.proofSentAt ? `<span style="color:#059669;font-weight:600">${escapeHtml(c.proofSentAt)}</span>` : ''}${c.proofUrl && safePrintUrl(c.proofUrl) ? `<br><a href="${safePrintUrl(c.proofUrl)}">${escapeHtml(c.proofUrl.replace(/^https?:\/\//, '').slice(0, 40))}${c.proofUrl.length > 47 ? '…' : ''}</a>` : ''}`
      : '<span style="color:#9ca3af">—</span>'
    return `
    <tr${isOverdueRow ? ' style="background:#fff1f2"' : ''}>
      <td><strong>${escapeHtml(c.name)}</strong></td>
      <td>${escapeHtml(c.role || '—')}</td>
      <td>${escapeHtml(c.location || '—')}</td>
      <td><span class="badge" style="background:${statusColors[c.status]}">${STATUS_LABELS[c.status]}</span></td>
      <td><span class="badge" style="background:${priorityColors[c.priority]}">${PRIORITY_LABELS[c.priority]}</span></td>
      <td${c.applicationDeadline && c.applicationDeadline <= new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10) ? ' style="color:#dc2626;font-weight:600"' : ''}>${escapeHtml(c.applicationDeadline || '—')}</td>
      <td${isOverdueRow ? ' style="color:#dc2626;font-weight:600"' : ''}>${escapeHtml(c.nextFollowUpDate || '—')}</td>
      <td>${proofCell}</td>
    </tr>`
  }).join('')

  return `<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8">
<title>WBS Bewerbungsnachweis</title>
<style>
  *{box-sizing:border-box}
  body{font-family:"Segoe UI",Arial,sans-serif;font-size:11px;color:#1f2a37;margin:0;padding:20px}
  h1{font-size:17px;margin:0 0 2px;color:#1e293b}
  .sub{color:#6b7280;font-size:10px;margin-bottom:10px}
  .kpi-row{display:flex;gap:12px;margin-bottom:12px}
  .kpi{padding:8px 14px;border-radius:6px;border:1px solid #e2e8f0;background:#f8fafc;text-align:center;flex:1}
  .kpi-num{font-size:18px;font-weight:700;color:#1e293b}
  .kpi-label{font-size:9px;color:#6b7280;margin-top:1px}
  .stats{display:flex;flex-wrap:wrap;gap:6px 14px;margin-bottom:12px;padding:8px 12px;background:#f8fafc;border-radius:6px;border:1px solid #e2e8f0}
  .stat{font-size:10px;color:#374151}
  table{width:100%;border-collapse:collapse}
  th{background:#f1f5f9;text-align:left;padding:6px 8px;font-size:10px;font-weight:600;border-bottom:2px solid #e2e8f0}
  td{padding:5px 8px;border-bottom:1px solid #f1f5f9;vertical-align:top;font-size:10px}
  tr:nth-child(even) td{background:#fafbfc}
  .badge{padding:2px 6px;border-radius:999px;font-size:9px;font-weight:600;display:inline-block}
  a{color:#0f5cc0;font-size:9px;word-break:break-all}
  @media print{body{padding:0}@page{margin:10mm;size:A4 landscape}}
</style></head><body>
  <h1>WBS Bewerbungsnachweis</h1>
  <p class="sub">Erstellt am ${date}</p>
  <div class="kpi-row">
    <div class="kpi"><div class="kpi-num">${list.length}</div><div class="kpi-label">Firmen gesamt</div></div>
    <div class="kpi"><div class="kpi-num">${bewerbenCount}</div><div class="kpi-label">Bewerbungen aktiv</div></div>
    <div class="kpi"><div class="kpi-num">${nachweisCount}</div><div class="kpi-label">Mit Nachweis</div></div>
    <div class="kpi" style="${overdueCount > 0 ? 'border-color:#fca5a5;background:#fff1f2' : ''}"><div class="kpi-num" style="${overdueCount > 0 ? 'color:#dc2626' : ''}">${overdueCount}</div><div class="kpi-label">Überfällige Follow-ups</div></div>
  </div>
  <div class="stats">${statsLine}</div>
  <table><thead><tr>
    <th>Firma</th><th>Stelle</th><th>Ort</th><th>Status</th>
    <th>Priorit&auml;t</th><th>Deadline</th><th>Follow-up</th><th>Nachweis (Datum / Link)</th>
  </tr></thead><tbody>${rows}</tbody></table>
</body></html>`
}

const exportPdf = () => {
  const win = window.open('', '_blank')
  if (!win) {
    window.alert(
      'Das PDF-Fenster wurde vom Browser blockiert.\n\n' +
      'Bitte erlaube Pop-ups für diese Seite in den Browser-Einstellungen und versuche es erneut.',
    )
    return
  }
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
    <Transition name="fade-slide">
      <div v-if="storageError" class="app-error-banner" role="alert">
        <span>⚠ {{ storageError }}</span>
        <button type="button" class="banner-close" @click="storageError = null" aria-label="Schließen">✕</button>
      </div>
    </Transition>
    <Transition name="fade-slide">
      <div v-if="seedError" class="app-error-banner app-error-banner--info" role="alert">
        <span>ℹ {{ seedError }}</span>
        <button type="button" class="banner-close" @click="seedError = null" aria-label="Schließen">✕</button>
      </div>
    </Transition>

    <header class="topbar">
      <span class="topbar-brand">Bewerbungs-Tracker</span>

      <nav class="topbar-nav" role="tablist" aria-label="Hauptnavigation">
        <button role="tab" type="button" class="nav-tab" :class="{ active: activeTab === 'tracker' }" :aria-selected="activeTab === 'tracker'" @click="activeTab = 'tracker'">Tracker</button>
        <button role="tab" type="button" class="nav-tab" :class="{ active: activeTab === 'stats' }"   :aria-selected="activeTab === 'stats'"   @click="activeTab = 'stats'">Statistiken</button>
        <button role="tab" type="button" class="nav-tab" :class="{ active: activeTab === 'jobs' }"    :aria-selected="activeTab === 'jobs'"    @click="activeTab = 'jobs'">Stellen</button>
        <button role="tab" type="button" class="nav-tab" :class="{ active: activeTab === 'calendar' }":aria-selected="activeTab === 'calendar'" @click="activeTab = 'calendar'">Kalender</button>
      </nav>

      <div class="topbar-tools">
        <!-- Theme -->
        <button
          type="button"
          class="icon-btn"
          :title="activeTheme === 'dark' ? 'Helles Design aktivieren' : 'Dunkles Design aktivieren'"
          @click="setThemePreference(activeTheme === 'dark' ? 'light' : 'dark')"
        >
          <svg v-if="activeTheme === 'dark'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        </button>

        <!-- Notifications -->
        <button
          type="button"
          class="icon-btn notification-btn"
          :title="notificationPermission === 'granted' ? 'Benachrichtigungen aktiv' : 'Benachrichtigungen aktivieren'"
          @click="notificationPermission === 'granted' ? triggerNotifications() : enableNotifications()"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          <span v-if="urgentCount > 0" class="notification-badge">{{ urgentCount }}</span>
        </button>

        <!-- Help -->
        <button
          type="button"
          class="icon-btn"
          :class="{ active: activeTab === 'hilfe' }"
          title="Hilfe & Erklärungen"
          @click="activeTab = 'hilfe'"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17" stroke-width="3"/></svg>
        </button>

        <span class="topbar-divider" aria-hidden="true" />

        <!-- More menu -->
        <div class="dropdown-wrap" ref="moreMenuEl">
          <button type="button" class="icon-btn" :class="{ active: showMoreMenu }" title="Weitere Optionen" @click.stop="showMoreMenu = !showMoreMenu">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
          </button>
          <Transition name="dropdown">
            <div v-if="showMoreMenu" class="dropdown-menu" role="menu">
              <button role="menuitem" type="button" class="dropdown-item" @click="showMoreMenu = false; showShareModal = true">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                Ansicht teilen
              </button>
              <div class="dropdown-divider" />
              <template v-if="fsSupported">
                <button role="menuitem" type="button" class="dropdown-item" @click="showMoreMenu = false; chooseSaveLocation()">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                  Speicherort wählen
                </button>
                <button role="menuitem" type="button" class="dropdown-item" @click="showMoreMenu = false; handleLoadFromFile()">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><polyline points="12 11 12 17"/><polyline points="9 14 12 17 15 14"/></svg>
                  Laden
                </button>
                <p v-if="fsHasPermission" class="dropdown-save-status">
                  <span class="save-dot" :class="{ 'save-dot--saving': fsIsSaving }" />
                  {{ fsIsSaving ? 'Speichert…' : activeFileName }}
                </p>
                <div class="dropdown-divider" />
              </template>
              <button role="menuitem" type="button" class="dropdown-item" @click="showMoreMenu = false; exportPdf()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                PDF exportieren
              </button>
              <button role="menuitem" type="button" class="dropdown-item" @click="showMoreMenu = false; exportData()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Daten exportieren
              </button>
              <button role="menuitem" type="button" class="dropdown-item" @click="showMoreMenu = false; openImport()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                Daten importieren
              </button>
            </div>
          </Transition>
        </div>

        <input ref="importInput" type="file" accept="application/json" class="hidden-input" @change="importData" />

        <button v-if="installPrompt && !isInstalled" type="button" class="ghost" style="font-size:0.82rem;white-space:nowrap" title="App installieren" @click="installApp">⬇ Installieren</button>

        <button type="button" class="primary" @click="openCreateModal">+ Bewerbung</button>
      </div>
    </header>

    <!-- ── Share-View (read-only) ── -->
    <template v-if="isShareView && sharePayload">
      <section class="share-readonly-wrap">
        <div class="share-readonly-stats">
          <div class="share-stat-card">
            <span class="share-stat-num">{{ sharePayload.entries.length }}</span>
            <span class="share-stat-label">Firmen gesamt</span>
          </div>
          <div class="share-stat-card">
            <span class="share-stat-num">{{ sharePayload.entries.filter(e => e.s !== 'Interested' && e.s !== 'Archived').length }}</span>
            <span class="share-stat-label">Aktive Bewerbungen</span>
          </div>
          <div class="share-stat-card">
            <span class="share-stat-num">{{ sharePayload.entries.filter(e => e.ps).length }}</span>
            <span class="share-stat-label">Mit Nachweis</span>
          </div>
          <div class="share-stat-card" :class="{ 'share-stat-card--warn': sharePayload.entries.filter(e => e.f && e.f < getTodayLocalIsoDate()).length > 0 }">
            <span class="share-stat-num">{{ sharePayload.entries.filter(e => e.f && e.f < getTodayLocalIsoDate()).length }}</span>
            <span class="share-stat-label">Überfällige Follow-ups</span>
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Firma</th>
                <th>Stelle</th>
                <th>Ort</th>
                <th>Status</th>
                <th>Priorität</th>
                <th>Deadline</th>
                <th>Abgeschickt am</th>
                <th>Nachweis</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(e, idx) in sharePayload.entries"
                :key="idx"
                :class="{ 'row-overdue': e.f && e.f < getTodayLocalIsoDate() }"
              >
                <td><strong>{{ e.n }}</strong></td>
                <td>{{ e.r || '—' }}</td>
                <td>{{ e.l || '—' }}</td>
                <td>
                  <select class="status-select" :data-status="e.s" disabled>
                    <option>{{ STATUS_LABELS[e.s] }}</option>
                  </select>
                </td>
                <td><span :class="PRIORITY_CLASS[e.p]">{{ PRIORITY_LABELS[e.p] }}</span></td>
                <td>{{ e.d || '—' }}</td>
                <td>
                  <span v-if="e.ps" style="color:#059669;font-weight:600;">{{ e.ps }}</span>
                  <span v-else class="text-muted">—</span>
                </td>
                <td>
                  <a v-if="e.pu" :href="e.pu" target="_blank" rel="noreferrer" style="font-size:0.82rem;">Link</a>
                  <span v-else-if="e.pn" style="font-size:0.82rem;">{{ e.pn }}</span>
                  <span v-else class="text-muted">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>

    <template v-else>

    <section v-if="activeTab === 'tracker'" class="controls-bar">
      <div class="controls-primary">
        <input v-model="searchText" class="controls-search" placeholder="Suche nach Firma, Stelle oder Ort" aria-label="Suche" />
        <select v-model="selectedStatus" class="controls-status">
          <option value="All">Alle Status</option>
          <option v-for="status in STATUSES" :key="status" :value="status">{{ STATUS_LABELS[status] }}</option>
        </select>
        <button type="button" class="filter-btn" :class="{ active: showFilterPanel || activeFilterCount > 0 }" @click="showFilterPanel = !showFilterPanel">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
          Filter
          <span v-if="activeFilterCount > 0" class="filter-badge">{{ activeFilterCount }}</span>
        </button>
        <div class="view-icon-group" role="group" aria-label="Ansicht wechseln">
          <button type="button" class="icon-btn" :class="{ active: viewMode === 'list' }" title="Listenansicht" @click="viewMode = 'list'">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6" stroke-width="3"/><line x1="3" y1="12" x2="3.01" y2="12" stroke-width="3"/><line x1="3" y1="18" x2="3.01" y2="18" stroke-width="3"/></svg>
          </button>
          <button type="button" class="icon-btn" :class="{ active: viewMode === 'kanban' }" title="Kanban-Ansicht" @click="viewMode = 'kanban'">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="5" height="18" rx="1"/><rect x="10" y="3" width="5" height="12" rx="1"/><rect x="17" y="3" width="5" height="15" rx="1"/></svg>
          </button>
          <button type="button" class="icon-btn" :class="{ active: viewMode === 'swimlane' }" title="Swimlane-Ansicht" @click="viewMode = 'swimlane'">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="9" x2="9" y2="21"/></svg>
          </button>
          <span class="topbar-divider" aria-hidden="true" style="height:16px;margin:0 0.1rem" />
          <button type="button" class="icon-btn" :class="{ active: showCompareMode }" title="Vergleichsmodus ein/aus" @click="showCompareMode = !showCompareMode">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
          </button>
        </div>
      </div>
      <Transition name="dropdown">
        <div v-if="showFilterPanel" class="filter-panel">
          <label>
            Tags
            <select v-model="selectedTag">
              <option value="All">Alle</option>
              <option v-for="tag in availableTags" :key="tag" :value="tag">{{ tag }}</option>
            </select>
          </label>
          <label>
            Follow-up
            <select v-model="selectedFollowUp">
              <option value="All">Alle</option>
              <option value="Due">Fällig</option>
              <option value="Overdue">Überfällig</option>
              <option value="None">Keins</option>
            </select>
          </label>
          <label>
            Priorität
            <select v-model="selectedPriority">
              <option value="All">Alle</option>
              <option v-for="p in PRIORITIES" :key="p" :value="p">{{ PRIORITY_LABELS[p] }}</option>
            </select>
          </label>
          <label>
            Sortierung
            <select v-model="sortBy">
              <option value="updated-desc">Zuletzt aktualisiert</option>
              <option value="follow-up-asc">Follow-up Datum</option>
              <option value="company-name">Firmenname</option>
              <option value="priority">Priorität</option>
              <option value="deadline-asc">Deadline</option>
            </select>
          </label>
          <button v-if="activeFilterCount > 0" type="button" class="ghost" style="align-self:flex-end;font-size:0.82rem" @click="clearFilters">Zurücksetzen</button>
        </div>
      </Transition>
    </section>

    <section v-if="activeTab === 'stats'">
      <StatsDashboard :companies="companies" />
    </section>

    <section v-else-if="activeTab === 'tracker' && filteredAndSortedCompanies.length && viewMode === 'list'" class="table-wrap">
      <table>
        <thead>
          <tr>
            <th v-if="showCompareMode" class="compare-col" title="Für Vergleich auswählen">Vgl.</th>
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
            <td v-if="showCompareMode" class="compare-col">
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

    <section v-else-if="activeTab === 'hilfe'">
      <HilfeTab @reset-training-type="handleResetTrainingType" />
    </section>

    <section v-else-if="activeTab === 'tracker'" class="empty">
      <h2>Keine Einträge gefunden</h2>
      <p>Filter anpassen oder eine neue Bewerbung hinzufügen.</p>
    </section>

    </template><!-- end share-view else -->

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

    <ShareModal
      v-model="showShareModal"
      :companies="companies"
      :training-type="trainingType || undefined"
    />

    <OnboardingModal v-if="showOnboarding" @select="selectTrainingType" />

    <!-- Share-View Banner -->
    <Transition name="fade-slide">
      <div v-if="isShareView && sharePayload" class="share-view-banner">
        <span>
          Geteilte Ansicht &mdash; {{ sharePayload.entries.length }} Einträge
          <template v-if="sharePayload.tt"> &middot; {{ sharePayload.tt }}</template>
          &middot; Stand {{ new Date(sharePayload.ts).toLocaleString('de-DE') }}
        </span>
        <button type="button" class="ghost" style="font-size:0.78rem;" @click="isShareView = false">Schließen</button>
      </div>
    </Transition>
  </main>
</template>
