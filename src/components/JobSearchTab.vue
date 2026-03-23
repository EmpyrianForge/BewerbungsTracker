<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { CompanyInput } from '../types/company'
import type { JobListing, JobSearchResponse } from '../types/jobListing'

const emit = defineEmits<{
  (event: 'add-to-tracker', preset: Partial<CompanyInput>): void
}>()

const ANGEBOTSART_OPTIONS = [
  { value: 34, label: 'Praktikum / Trainee' },
  { value: 1, label: 'Stelle' },
  { value: 4, label: 'Ausbildung' },
] as const

const RADIUS_OPTIONS = [10, 25, 50, 100, 200] as const

const DAYS_OPTIONS = [
  { value: 7, label: '7 Tage' },
  { value: 14, label: '14 Tage' },
  { value: 30, label: '30 Tage' },
  { value: 100, label: 'Alle' },
] as const

const was = ref('Praktikum')
const wo = ref('')
const umkreis = ref<number>(25)
const angebotsart = ref<number>(34)
const veroeffentlichtseit = ref<number>(30)
const page = ref(1)
const PAGE_SIZE = 25

const results = ref<JobListing[]>([])
const totalResults = ref(0)
const loading = ref(false)
const error = ref<string | null>(null)
const hasSearched = ref(false)
const isOffline = ref(!navigator.onLine)

const handleOnline = () => { isOffline.value = false }
const handleOffline = () => { isOffline.value = true }

onMounted(() => {
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
})

onUnmounted(() => {
  window.removeEventListener('online', handleOnline)
  window.removeEventListener('offline', handleOffline)
})

const totalPages = computed(() => Math.ceil(totalResults.value / PAGE_SIZE))

const search = async (resetPage = true) => {
  if (resetPage) page.value = 1
  loading.value = true
  error.value = null
  hasSearched.value = true

  try {
    const params = new URLSearchParams({
      was: was.value,
      page: String(page.value),
      size: String(PAGE_SIZE),
      angebotsart: String(angebotsart.value),
      veroeffentlichtseit: String(veroeffentlichtseit.value),
    })
    if (wo.value.trim()) {
      params.set('wo', wo.value.trim())
      params.set('umkreis', String(umkreis.value))
    }

    const response = await fetch(`/api/jobs?${params.toString()}`)
    if (!response.ok) throw new Error(`Serverfehler (${response.status})`)

    const data: JobSearchResponse = await response.json()
    results.value = data.stellenangebote ?? []
    totalResults.value = Number(data.maxErgebnisse) || 0
  } catch (e) {
    if (e instanceof TypeError) {
      error.value = 'Verbindung fehlgeschlagen. Stelle sicher, dass der Entwicklungsserver läuft (npm run dev).'
    } else {
      error.value = e instanceof Error ? e.message : 'Unbekannter Fehler'
    }
    results.value = []
    totalResults.value = 0
  } finally {
    loading.value = false
  }
}

const goToPage = async (newPage: number) => {
  page.value = newPage
  await search(false)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const formatDate = (dateStr: string): string => {
  try {
    return new Date(dateStr).toLocaleDateString('de-DE')
  } catch {
    return dateStr
  }
}

const formatLocation = (job: JobListing): string => {
  const parts: string[] = []
  if (job.arbeitsort.ort) parts.push(job.arbeitsort.ort)
  if (job.arbeitsort.region && job.arbeitsort.region !== job.arbeitsort.ort) {
    parts.push(job.arbeitsort.region)
  }
  return parts.join(', ') || '—'
}

const addToTracker = (job: JobListing) => {
  emit('add-to-tracker', {
    name: job.arbeitgeber,
    role: job.beruf,
    location: formatLocation(job),
    url: `https://www.arbeitsagentur.de/jobsuche/jobdetail/${job.refnr}`,
    source: 'Bundesagentur für Arbeit',
    status: 'Interested',
  })
}

const jobUrl = (job: JobListing) => `https://www.arbeitsagentur.de/jobsuche/jobdetail/${job.refnr}`
</script>

<template>
  <div class="job-search">
    <div v-if="isOffline" class="job-state-box job-offline-banner">
      Du bist gerade offline — die Stellensuche ist nicht verfügbar. Deine gespeicherten Bewerbungen sind weiterhin zugänglich.
    </div>
    <form class="job-search-form" @submit.prevent="search(true)">
      <label>
        Stichwort
        <input v-model="was" placeholder="z.B. Praktikum Informatik" />
      </label>
      <label>
        Ort
        <input v-model="wo" placeholder="z.B. Berlin, 80331" />
      </label>
      <label>
        Umkreis
        <select v-model="umkreis">
          <option v-for="r in RADIUS_OPTIONS" :key="r" :value="r">{{ r }} km</option>
        </select>
      </label>
      <label>
        Angebotsart
        <select v-model="angebotsart">
          <option v-for="opt in ANGEBOTSART_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </label>
      <label>
        Veröffentlicht
        <select v-model="veroeffentlichtseit">
          <option v-for="opt in DAYS_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </label>
      <button type="submit" class="primary" :disabled="loading || isOffline">
        {{ loading ? 'Läuft…' : 'Suchen' }}
      </button>
    </form>

    <div v-if="loading" class="job-state-box">
      Stellenangebote werden geladen…
    </div>

    <div v-else-if="error" class="job-state-box job-error">
      <strong>Fehler:</strong> {{ error }}
    </div>

    <template v-else-if="hasSearched">
      <div class="job-state-box job-results-header">
        <span v-if="totalResults > 0">
          <strong>{{ totalResults.toLocaleString('de-DE') }}</strong> Stellenangebote gefunden
          <span v-if="totalPages > 1"> — Seite {{ page }} / {{ totalPages }}</span>
        </span>
        <span v-else>Keine Ergebnisse gefunden. Suchbegriff oder Ort anpassen.</span>
      </div>

      <div v-if="results.length" class="job-results">
        <article v-for="job in results" :key="job.hashId" class="job-card">
          <div class="job-card-header">
            <h3 class="job-card-title">{{ job.beruf }}</h3>
            <p class="job-card-company">{{ job.arbeitgeber }}</p>
          </div>
          <div class="job-card-meta">
            <span>{{ formatLocation(job) }}</span>
            <span>Veröff. {{ formatDate(job.aktuelleVeroeffentlichungsdatum) }}</span>
            <span v-if="job.eintrittsdatum">Eintritt: {{ formatDate(job.eintrittsdatum) }}</span>
          </div>
          <div class="job-card-actions">
            <button type="button" class="primary" @click="addToTracker(job)">+ In Tracker</button>
            <a :href="jobUrl(job)" target="_blank" rel="noreferrer" class="job-external-link">Zur Stelle</a>
          </div>
        </article>
      </div>

      <nav v-if="totalPages > 1" class="job-pagination" aria-label="Seitennavigation">
        <button type="button" class="ghost" :disabled="page <= 1" @click="goToPage(page - 1)">Zurück</button>
        <span class="job-pagination-info">{{ page }} / {{ totalPages }}</span>
        <button type="button" class="ghost" :disabled="page >= totalPages" @click="goToPage(page + 1)">Weiter</button>
      </nav>
    </template>

    <div v-else class="job-state-box job-empty-state">
      <p>Suche nach Praktikumsstellen, Stellen oder Ausbildungsplätzen aus der Jobbörse der Bundesagentur für Arbeit.</p>
      <p>Interessante Stellen können direkt in den Tracker übernommen werden.</p>
    </div>
  </div>
</template>
