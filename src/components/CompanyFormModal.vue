<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { STATUSES, type Company, type CompanyInput, type CompanyStatus } from '../types/company'

const STATUS_LABELS: Record<CompanyStatus, string> = {
  Interested: 'Interessiert',
  Applied: 'Beworben',
  Interviewing: 'Im Gespräch',
  Offer: 'Angebot',
  Rejected: 'Absage',
  Archived: 'Archiv',
}

const props = defineProps<{
  modelValue: boolean
  mode: 'create' | 'edit'
  company?: Company
  preset?: Partial<CompanyInput>
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (event: 'save', value: CompanyInput): void
}>()

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
  interviewAt: undefined,
  lastActionAt: undefined,
  lastActionNote: '',
})

const form = reactive<CompanyInput>(emptyForm())
const tagInput = computed({
  get: () => form.tags.join(', '),
  set: (value: string) => {
    form.tags = value
      .split(',')
      .map((item) => item.trim())
      .filter((item, index, arr) => item.length > 0 && arr.indexOf(item) === index)
  },
})

watch(
  () => props.modelValue,
  (isOpen) => {
    if (!isOpen) {
      return
    }

    const source = props.company
    if (!source) {
      Object.assign(form, { ...emptyForm(), ...(props.preset ?? {}) })
      return
    }

    Object.assign(form, {
      name: source.name,
      role: source.role,
      location: source.location,
      url: source.url,
      contact: source.contact,
      salaryRange: source.salaryRange,
      source: source.source,
      status: source.status,
      notes: source.notes,
      tags: [...source.tags],
      nextFollowUpDate: source.nextFollowUpDate,
      interviewAt: source.interviewAt,
      lastActionAt: source.lastActionAt,
      lastActionNote: source.lastActionNote,
    })
  },
)

const close = () => emit('update:modelValue', false)

const submit = () => {
  if (!form.name.trim()) {
    return
  }

  emit('save', {
    ...form,
    name: form.name.trim(),
    role: form.role.trim(),
    location: form.location.trim(),
    url: form.url.trim(),
    contact: form.contact.trim(),
    salaryRange: form.salaryRange.trim(),
    source: form.source.trim(),
    notes: form.notes.trim(),
    nextFollowUpDate: form.nextFollowUpDate || undefined,
    interviewAt: form.interviewAt || undefined,
    lastActionAt: form.lastActionAt || undefined,
    lastActionNote: form.lastActionNote.trim(),
  })
  close()
}
</script>

<template>
  <div v-if="modelValue" class="overlay" @click.self="close">
    <div class="modal">
      <header class="modal-header">
        <h2>{{ mode === 'create' ? 'Bewerbung hinzufügen' : 'Bewerbung bearbeiten' }}</h2>
        <button type="button" class="ghost" @click="close">Schließen</button>
      </header>

      <form class="form" @submit.prevent="submit">
        <label>
          Firma
          <input v-model="form.name" required maxlength="120" />
        </label>
        <label>
          Stelle / Position
          <input v-model="form.role" maxlength="120" />
        </label>
        <label>
          Ort
          <input v-model="form.location" maxlength="120" />
        </label>
        <label>
          URL
          <input v-model="form.url" type="url" placeholder="https://..." />
        </label>
        <label>
          Kontakt
          <input v-model="form.contact" maxlength="120" placeholder="Name, E-Mail, LinkedIn, …" />
        </label>
        <label>
          Gehaltsspanne
          <input v-model="form.salaryRange" maxlength="120" placeholder="z.B. 50.000–60.000€" />
        </label>
        <label>
          Quelle
          <input v-model="form.source" maxlength="120" placeholder="z.B. LinkedIn, Empfehlung, Karriereseite" />
        </label>
        <label>
          Status
          <select v-model="form.status">
            <option v-for="status in STATUSES" :key="status" :value="status">{{ STATUS_LABELS[status] }}</option>
          </select>
        </label>
        <label>
          Nächstes Follow-up
          <input v-model="form.nextFollowUpDate" type="date" />
        </label>
        <label>
          Vorstellungsgespräch (Datum/Uhrzeit)
          <input v-model="form.interviewAt" type="datetime-local" />
        </label>
        <label>
          Tags (durch Komma getrennt)
          <input v-model="tagInput" placeholder="remote, startup, empfehlung" />
        </label>
        <label>
          Letzte Aktion (Datum)
          <input v-model="form.lastActionAt" type="date" />
        </label>
        <label>
          Letzte Aktion (Notiz)
          <textarea v-model="form.lastActionNote" rows="2" />
        </label>
        <label>
          Notizen
          <textarea v-model="form.notes" rows="4" />
        </label>
        <div class="actions">
          <button type="button" class="ghost" @click="close">Abbrechen</button>
          <button type="submit" class="primary">{{ mode === 'create' ? 'Anlegen' : 'Speichern' }}</button>
        </div>
      </form>
    </div>
  </div>
</template>
