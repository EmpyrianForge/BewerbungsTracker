<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue'
import type { CompanyStatus, Company, Priority, CompanyRating } from '../types/company'

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

const props = defineProps<{
  modelValue: boolean
  company?: Company
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (event: 'edit'): void
  (event: 'delete'): void
  (event: 'add-activity', note: string): void
  (event: 'update-rating', value: CompanyRating): void
}>()

const RATING_DIMENSIONS: { key: keyof Omit<CompanyRating, 'comment'>; label: string }[] = [
  { key: 'culture', label: 'Unternehmenskultur' },
  { key: 'salary', label: 'Gehalt' },
  { key: 'flexibility', label: 'Remote / Flexibilität' },
  { key: 'overall', label: 'Gesamteindruck' },
]

const emptyRating = (): CompanyRating => ({ culture: 0, salary: 0, flexibility: 0, overall: 0, comment: '' })

const localRating = reactive<CompanyRating>(emptyRating())

const saveRating = () => {
  emit('update-rating', { ...localRating })
}

const newActivityNote = ref('')
const copiedKey = ref<string | null>(null)

const applicationTemplate = computed(() => {
  if (!props.company) return ''
  const c = props.company
  const roleText = c.role ? `als ${c.role} ` : ''
  return `Betreff: Bewerbung ${roleText}– ${c.name}\n\nSehr geehrte Damen und Herren,\n\nmit großem Interesse möchte ich mich ${roleText}bei ${c.name}${c.location ? ` in ${c.location}` : ''} bewerben.\n\n[Ihre Motivation und Qualifikationen hier einfügen]\n\nÜber eine Einladung zum persönlichen Gespräch würde ich mich sehr freuen.\n\nMit freundlichen Grüßen,\n[Ihr Name]`
})

const followUpTemplate = computed(() => {
  if (!props.company) return ''
  const c = props.company
  return `Betreff: Nachfrage – Bewerbung${c.role ? ` als ${c.role}` : ''} | ${c.name}\n\nSehr geehrte Damen und Herren,\n\nich habe mich für die Position${c.role ? ` als ${c.role}` : ''} bei ${c.name} beworben und wollte höflich nachfragen, ob meine Unterlagen vollständig angekommen sind und wie der aktuelle Stand ist.\n\nMit freundlichen Grüßen,\n[Ihr Name]`
})

const sortedActivityLog = computed(() => {
  if (!props.company) return []
  return [...props.company.activityLog].sort((a, b) => b.date.localeCompare(a.date))
})

const copyTemplate = async (key: string, text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    copiedKey.value = key
    setTimeout(() => {
      copiedKey.value = null
    }, 2000)
  } catch {
    /* ignore */
  }
}

const addActivity = () => {
  if (!newActivityNote.value.trim()) return
  emit('add-activity', newActivityNote.value.trim())
  newActivityNote.value = ''
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (!isOpen) newActivityNote.value = ''
  },
)

watch(
  () => props.company,
  (company) => {
    const r = company?.rating
    localRating.culture = r?.culture ?? 0
    localRating.salary = r?.salary ?? 0
    localRating.flexibility = r?.flexibility ?? 0
    localRating.overall = r?.overall ?? 0
    localRating.comment = r?.comment ?? ''
  },
  { immediate: true },
)

const close = () => emit('update:modelValue', false)
</script>

<template>
  <Transition name="fade-slide">
  <div v-if="modelValue && company" class="overlay" @click.self="close">
    <div class="modal detail" role="dialog" aria-modal="true" aria-labelledby="detail-modal-title">
      <header class="modal-header">
        <h2 id="detail-modal-title">{{ company.name }}</h2>
        <button type="button" class="ghost" @click="close">Schließen</button>
      </header>

      <div class="detail-grid">
        <p><strong>Stelle / Position:</strong> {{ company.role || '—' }}</p>
        <p><strong>Ort:</strong> {{ company.location || '—' }}</p>
        <p>
          <strong>Status:</strong>
          <span class="badge">{{ STATUS_LABELS[company.status] }}</span>
        </p>
        <p>
          <strong>Priorität:</strong>
          <span :class="PRIORITY_CLASS[company.priority]">{{ PRIORITY_LABELS[company.priority] }}</span>
        </p>
        <p><strong>Bewerbungstyp:</strong> {{ company.applicationType }}</p>
        <p>
          <strong>Bewerbungsdeadline:</strong>
          <span v-if="company.applicationDeadline" :class="{ 'deadline-near': company.applicationDeadline <= new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10) }">
            {{ company.applicationDeadline }}
          </span>
          <span v-else>—</span>
        </p>
        <p><strong>Kontakt:</strong> {{ company.contact || '—' }}</p>
        <p><strong>Gehaltsspanne:</strong> {{ company.salaryRange || '—' }}</p>
        <p><strong>Quelle:</strong> {{ company.source || '—' }}</p>
        <p>
          <strong>Link:</strong>
          <a v-if="company.url" :href="company.url" target="_blank" rel="noreferrer">{{ company.url }}</a>
          <span v-else>—</span>
        </p>
        <p><strong>Follow-up:</strong> {{ company.nextFollowUpDate || '—' }}</p>
        <p>
          <strong>Vorstellungsgespräch:</strong>
          {{ company.interviewAt ? new Date(company.interviewAt).toLocaleString('de-DE') : '—' }}
        </p>
        <p><strong>Letzte Aktion (Datum):</strong> {{ company.lastActionAt || '—' }}</p>
        <p><strong>Letzte Aktion (Notiz):</strong> {{ company.lastActionNote || '—' }}</p>
        <p><strong>Angelegt:</strong> {{ new Date(company.createdAt).toLocaleString('de-DE') }}</p>
        <p><strong>Aktualisiert:</strong> {{ new Date(company.updatedAt).toLocaleString('de-DE') }}</p>
      </div>

      <!-- Documents checklist -->
      <div style="margin-top: 0.75rem;">
        <strong>Dokumente:</strong>
        <div class="docs-checklist" style="margin-top: 0.4rem;">
          <span class="doc-item">
            <span>{{ company.documents.cv ? '✓' : '✗' }}</span> Lebenslauf
          </span>
          <span class="doc-item">
            <span>{{ company.documents.coverLetter ? '✓' : '✗' }}</span> Anschreiben
          </span>
          <span class="doc-item">
            <span>{{ company.documents.certificates ? '✓' : '✗' }}</span> Zeugnisse
          </span>
          <span class="doc-item">
            <span>{{ company.documents.portfolio ? '✓' : '✗' }}</span> Portfolio
          </span>
        </div>
      </div>

      <!-- Star rating -->
      <div class="rating-section">
        <strong>Bewertung</strong>
        <div class="rating-rows">
          <div v-for="dim in RATING_DIMENSIONS" :key="dim.key" class="rating-row">
            <span class="rating-label">{{ dim.label }}</span>
            <div class="star-group" role="group" :aria-label="dim.label">
              <button
                v-for="i in 5"
                :key="i"
                type="button"
                class="star-btn"
                :class="{ 'star-active': localRating[dim.key] >= i }"
                :aria-label="`${i} Stern${i > 1 ? 'e' : ''}`"
                @click="localRating[dim.key] = i"
              >★</button>
            </div>
          </div>
        </div>
        <label class="rating-comment-label">
          Kommentar
          <textarea v-model="localRating.comment" rows="2" placeholder="Eigene Einschätzung …" />
        </label>
        <button type="button" class="ghost" style="margin-top: 0.4rem" @click="saveRating">Bewertung speichern</button>
      </div>

      <p class="notes"><strong>Notizen:</strong> {{ company.notes || '—' }}</p>

      <div v-if="company.tags.length" class="tag-list">
        <span v-for="tag in company.tags" :key="tag" class="tag">{{ tag }}</span>
      </div>

      <!-- Activity log -->
      <div class="activity-section">
        <strong>Aktivitätslog</strong>
        <div class="activity-add">
          <textarea
            v-model="newActivityNote"
            rows="2"
            placeholder="Neue Aktivität eintragen …"
          />
          <button type="button" class="ghost" @click="addActivity">Eintragen</button>
        </div>
        <ul v-if="sortedActivityLog.length" class="activity-list">
          <li v-for="entry in sortedActivityLog" :key="entry.id" class="activity-entry">
            <span class="activity-date">{{ new Date(entry.date).toLocaleString('de-DE') }}</span>
            <span class="activity-note">{{ entry.note }}</span>
          </li>
        </ul>
        <p v-else style="color: var(--text-muted); font-size: 0.88rem;">Noch keine Einträge.</p>
      </div>

      <!-- Email templates -->
      <details class="template-section">
        <summary>E-Mail Vorlagen</summary>
        <div class="template-block">
          <h4>Bewerbung</h4>
          <pre class="template-pre">{{ applicationTemplate }}</pre>
          <div class="template-actions">
            <button type="button" class="ghost" @click="copyTemplate('application', applicationTemplate)">
              {{ copiedKey === 'application' ? 'Kopiert!' : 'Kopieren' }}
            </button>
          </div>
        </div>
        <div class="template-block">
          <h4>Follow-up</h4>
          <pre class="template-pre">{{ followUpTemplate }}</pre>
          <div class="template-actions">
            <button type="button" class="ghost" @click="copyTemplate('followup', followUpTemplate)">
              {{ copiedKey === 'followup' ? 'Kopiert!' : 'Kopieren' }}
            </button>
          </div>
        </div>
      </details>

      <div class="actions">
        <button type="button" class="danger" @click="emit('delete')">Löschen</button>
        <button type="button" class="primary" @click="emit('edit')">Bearbeiten</button>
      </div>
    </div>
  </div>
  </Transition>
</template>
