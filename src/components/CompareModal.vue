<script setup lang="ts">
import type { Company, CompanyStatus, Priority } from '../types/company'

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

const RATING_LABELS = ['culture', 'salary', 'flexibility', 'overall'] as const
const RATING_NAMES: Record<(typeof RATING_LABELS)[number], string> = {
  culture: 'Unternehmenskultur',
  salary: 'Gehalt',
  flexibility: 'Remote / Flexibilität',
  overall: 'Gesamteindruck',
}

const props = defineProps<{
  modelValue: boolean
  companies: Company[]
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
}>()

const close = () => emit('update:modelValue', false)

const starsFor = (value: number) => {
  return '★'.repeat(value) + '☆'.repeat(5 - value)
}
</script>

<template>
  <Transition name="fade-slide">
    <div v-if="modelValue && companies.length >= 2" class="overlay" @click.self="close">
      <div
        class="modal compare-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="compare-modal-title"
      >
        <header class="modal-header">
          <h2 id="compare-modal-title">Vergleich ({{ companies.length }} Bewerbungen)</h2>
          <button type="button" class="ghost" @click="close">Schließen</button>
        </header>

        <div class="compare-table-wrap">
          <table class="compare-table">
            <thead>
              <tr>
                <th class="compare-field-col">Feld</th>
                <th v-for="c in companies" :key="c.id">{{ c.name }}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="compare-field-col">Stelle</td>
                <td v-for="c in companies" :key="c.id">{{ c.role || '—' }}</td>
              </tr>
              <tr>
                <td class="compare-field-col">Ort</td>
                <td v-for="c in companies" :key="c.id">{{ c.location || '—' }}</td>
              </tr>
              <tr>
                <td class="compare-field-col">Status</td>
                <td v-for="c in companies" :key="c.id">
                  <span class="badge">{{ STATUS_LABELS[c.status] }}</span>
                </td>
              </tr>
              <tr>
                <td class="compare-field-col">Priorität</td>
                <td v-for="c in companies" :key="c.id">{{ PRIORITY_LABELS[c.priority] }}</td>
              </tr>
              <tr>
                <td class="compare-field-col">Gehaltsspanne</td>
                <td v-for="c in companies" :key="c.id">{{ c.salaryRange || '—' }}</td>
              </tr>
              <tr>
                <td class="compare-field-col">Bewerbungstyp</td>
                <td v-for="c in companies" :key="c.id">{{ c.applicationType }}</td>
              </tr>
              <tr>
                <td class="compare-field-col">Deadline</td>
                <td v-for="c in companies" :key="c.id">{{ c.applicationDeadline || '—' }}</td>
              </tr>
              <tr>
                <td class="compare-field-col">Follow-up</td>
                <td v-for="c in companies" :key="c.id">{{ c.nextFollowUpDate || '—' }}</td>
              </tr>
              <tr>
                <td class="compare-field-col">Kontakt</td>
                <td v-for="c in companies" :key="c.id">{{ c.contact || '—' }}</td>
              </tr>
              <tr>
                <td class="compare-field-col">Tags</td>
                <td v-for="c in companies" :key="c.id">
                  <div v-if="c.tags.length" class="tag-list">
                    <span v-for="tag in c.tags" :key="tag" class="tag">{{ tag }}</span>
                  </div>
                  <span v-else>—</span>
                </td>
              </tr>
              <template v-for="dim in RATING_LABELS" :key="dim">
                <tr>
                  <td class="compare-field-col">{{ RATING_NAMES[dim] }}</td>
                  <td v-for="c in companies" :key="c.id">
                    <span v-if="c.rating" class="compare-stars">{{ starsFor(c.rating[dim]) }}</span>
                    <span v-else class="compare-stars compare-stars--empty">☆☆☆☆☆</span>
                  </td>
                </tr>
              </template>
              <tr>
                <td class="compare-field-col">Kommentar</td>
                <td v-for="c in companies" :key="c.id">{{ c.rating?.comment || '—' }}</td>
              </tr>
              <tr>
                <td class="compare-field-col">Notizen</td>
                <td v-for="c in companies" :key="c.id" class="compare-notes">{{ c.notes || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </Transition>
</template>
