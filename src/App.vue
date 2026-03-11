<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import CompanyDetailModal from './components/CompanyDetailModal.vue'
import CompanyFormModal from './components/CompanyFormModal.vue'
import CalendarTab from './components/CalendarTab.vue'
import { useCompanies } from './composables/useCompanies'
import { STATUSES, type Company, type CompanyInput, type CompanyStatus } from './types/company'

type Theme = 'light' | 'dark'
type ViewMode = 'list' | 'kanban'
type FollowUpFilter = 'All' | 'Due' | 'Overdue' | 'None'
type SortOption = 'updated-desc' | 'follow-up-asc' | 'company-name'

type Tab = 'tracker' | 'calendar'

const STATUS_LABELS: Record<CompanyStatus, string> = {
  Interested: 'Interessiert',
  Applied: 'Beworben',
  Interviewing: 'Im Gespräch',
  Offer: 'Angebot',
  Rejected: 'Absage',
  Archived: 'Archiv',
}

const THEME_STORAGE_KEY = 'apply-tracker.theme.v1'
const COMPANY_STORAGE_KEY = 'apply-tracker.companies.v1'
const SEED_URL = '/bewerbungstracker-import.json'

const {
  companies,
  addCompany,
  updateCompany,
  updateCompanyStatus,
  deleteCompany,
  importCompaniesFromJson,
  mergeImportedCompanies,
  exportCompaniesJson,
} = useCompanies()

const searchText = ref('')
const selectedStatus = ref<CompanyStatus | 'All'>('All')
const selectedTag = ref<'All' | string>('All')
const selectedFollowUp = ref<FollowUpFilter>('All')
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
const importInput = ref<HTMLInputElement | null>(null)

const systemTheme = ref<Theme>('light')
const themePreference = ref<Theme | null>(null)
const activeTheme = computed<Theme>(() => themePreference.value ?? systemTheme.value)
let removeThemeListener: (() => void) | undefined

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

const seedInitialData = async () => {
  // Only seed if the user has no data yet.
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

    // This also writes to localStorage via the companies watcher.
    mergeImportedCompanies(imported)
  } catch {
    // ignore
  }
}

onMounted(async () => {
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

    return matchesSearch && matchesStatus && matchesTag && matchesFollowUp
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

    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })
})

const kanbanColumns = computed(() => {
  return STATUSES.map((status) => ({
    status,
    items: filteredAndSortedCompanies.value.filter((company) => company.status === status),
  }))
})

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

const onDropToStatus = (status: CompanyStatus) => {
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
}
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
        <button type="button" class="ghost" @click="exportData">Export</button>
        <button type="button" class="ghost" @click="openImport">Import</button>
        <input ref="importInput" type="file" accept="application/json" class="hidden-input" @change="importData" />
        <button type="button" class="primary" @click="openCreateModal">+ Bewerbung</button>
      </div>
    </header>

    <section v-if="activeTab === 'tracker'" class="controls">
      <input v-model="searchText" placeholder="Suche nach Firma, Stelle oder Ort" />
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
      <select v-model="sortBy">
        <option value="updated-desc">Sortierung: Zuletzt aktualisiert</option>
        <option value="follow-up-asc">Sortierung: Follow-up Datum</option>
        <option value="company-name">Sortierung: Firmenname</option>
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
      </div>
    </section>

    <section v-if="activeTab === 'tracker' && filteredAndSortedCompanies.length && viewMode === 'list'" class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Firma</th>
            <th>Stelle</th>
            <th>Ort</th>
            <th>Status</th>
            <th>Tags</th>
            <th>Follow-up</th>
            <th>Aktualisiert</th>
            <th>Aktionen</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="company in filteredAndSortedCompanies"
            :key="company.id"
            :class="{ 'row-overdue': isOverdue(company) }"
          >
            <td>
              <button type="button" class="link-btn" @click="openDetailModal(company)">{{ company.name }}</button>
            </td>
            <td>{{ company.role || '-' }}</td>
            <td>{{ company.location || '-' }}</td>
            <td><span class="badge">{{ STATUS_LABELS[company.status] }}</span></td>
            <td>
              <div class="tag-list">
                <span v-for="tag in company.tags" :key="tag" class="tag">{{ tag }}</span>
              </div>
            </td>
            <td>{{ company.nextFollowUpDate || '-' }}</td>
            <td>{{ new Date(company.updatedAt).toLocaleDateString('de-DE') }}</td>
            <td>
              <button type="button" class="ghost" @click="openEditModal(company)">Bearbeiten</button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <section v-else-if="activeTab === 'tracker' && filteredAndSortedCompanies.length" class="kanban-wrap">
      <article
        v-for="column in kanbanColumns"
        :key="column.status"
        class="kanban-column"
        @dragover.prevent
        @drop="onDropToStatus(column.status)"
      >
        <header class="kanban-column-header">
          <h3>{{ STATUS_LABELS[column.status] }}</h3>
          <span>{{ column.items.length }}</span>
        </header>
        <div class="kanban-cards">
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
            <strong>{{ company.name }}</strong>
            <span>{{ company.role || '—' }}</span>
            <span class="kanban-follow-up">Follow-up: {{ company.nextFollowUpDate || '—' }}</span>
            <div class="tag-list">
              <span v-for="tag in company.tags" :key="tag" class="tag">{{ tag }}</span>
            </div>
          </button>
          <p v-if="!column.items.length" class="kanban-empty">Keine Einträge</p>
        </div>
      </article>
    </section>

    <section v-else-if="activeTab === 'calendar'">
      <CalendarTab :companies="companies" @open="openDetailModal" />
    </section>

    <section v-else class="empty">
      <h2>Keine Einträge gefunden</h2>
      <p>Filter anpassen oder eine neue Bewerbung hinzufügen.</p>
    </section>

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
    />
  </main>
</template>
