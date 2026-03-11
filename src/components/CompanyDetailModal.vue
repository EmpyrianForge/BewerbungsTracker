<script setup lang="ts">
import type { CompanyStatus, Company } from '../types/company'

const STATUS_LABELS: Record<CompanyStatus, string> = {
  Interested: 'Interessiert',
  Applied: 'Beworben',
  Interviewing: 'Im Gespräch',
  Offer: 'Angebot',
  Rejected: 'Absage',
  Archived: 'Archiv',
}

defineProps<{
  modelValue: boolean
  company?: Company
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (event: 'edit'): void
  (event: 'delete'): void
}>()

const close = () => emit('update:modelValue', false)
</script>

<template>
  <div v-if="modelValue && company" class="overlay" @click.self="close">
    <div class="modal detail">
      <header class="modal-header">
        <h2>{{ company.name }}</h2>
        <button type="button" class="ghost" @click="close">Schließen</button>
      </header>

      <div class="detail-grid">
        <p><strong>Stelle / Position:</strong> {{ company.role || '—' }}</p>
        <p><strong>Ort:</strong> {{ company.location || '—' }}</p>
        <p><strong>Status:</strong> <span class="badge">{{ STATUS_LABELS[company.status] }}</span></p>
        <p><strong>Kontakt:</strong> {{ company.contact || '—' }}</p>
        <p><strong>Gehaltsspanne:</strong> {{ company.salaryRange || '—' }}</p>
        <p><strong>Quelle:</strong> {{ company.source || '—' }}</p>
        <p>
          <strong>Link:</strong>
          <a v-if="company.url" :href="company.url" target="_blank" rel="noreferrer">{{ company.url }}</a>
          <span v-else>—</span>
        </p>
        <p><strong>Follow-up:</strong> {{ company.nextFollowUpDate || '—' }}</p>
        <p><strong>Vorstellungsgespräch:</strong> {{ company.interviewAt ? new Date(company.interviewAt).toLocaleString('de-DE') : '—' }}</p>
        <p><strong>Letzte Aktion (Datum):</strong> {{ company.lastActionAt || '—' }}</p>
        <p><strong>Letzte Aktion (Notiz):</strong> {{ company.lastActionNote || '—' }}</p>
        <p><strong>Angelegt:</strong> {{ new Date(company.createdAt).toLocaleString('de-DE') }}</p>
        <p><strong>Aktualisiert:</strong> {{ new Date(company.updatedAt).toLocaleString('de-DE') }}</p>
      </div>

      <p class="notes"><strong>Notizen:</strong> {{ company.notes || '—' }}</p>

      <div v-if="company.tags.length" class="tag-list">
        <span v-for="tag in company.tags" :key="tag" class="tag">{{ tag }}</span>
      </div>

      <div class="actions">
        <button type="button" class="danger" @click="emit('delete')">Löschen</button>
        <button type="button" class="primary" @click="emit('edit')">Bearbeiten</button>
      </div>
    </div>
  </div>
</template>
