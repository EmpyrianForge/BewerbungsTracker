<script setup lang="ts">
import { computed } from 'vue'
import type { Company } from '../types/company'

type CalendarEvent = {
  kind: 'interview' | 'followup'
  at: string
  label: string
  company: Company
}

const props = defineProps<{
  companies: Company[]
}>()

const emit = defineEmits<{
  (event: 'open', company: Company): void
}>()

const events = computed<CalendarEvent[]>(() => {
  const result: CalendarEvent[] = []

  for (const company of props.companies) {
    if (company.interviewAt) {
      result.push({
        kind: 'interview',
        at: company.interviewAt,
        label: 'Vorstellungsgespräch',
        company,
      })
    }

    if (company.nextFollowUpDate) {
      // Treat follow-up as local date.
      result.push({
        kind: 'followup',
        at: `${company.nextFollowUpDate}T09:00:00`,
        label: 'Follow-up',
        company,
      })
    }
  }

  return result
    .filter((event) => !Number.isNaN(new Date(event.at).getTime()))
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
})

const upcoming = computed(() => {
  const now = Date.now()
  return events.value.filter((event) => new Date(event.at).getTime() >= now - 12 * 60 * 60 * 1000)
})
</script>

<template>
  <section class="calendar-tab">
    <header class="calendar-header">
      <div>
        <h2>Kalender</h2>
        <p class="muted">Zeigt geplante Vorstellungsgespräche und Follow-ups aus deinen Einträgen.</p>
      </div>
    </header>

    <div v-if="!upcoming.length" class="empty">
      <h3>Keine Termine</h3>
      <p>Trage bei einer Bewerbung ein „Vorstellungsgespräch“ oder ein „Follow-up“ ein.</p>
    </div>

    <div v-else class="event-list">
      <article v-for="event in upcoming" :key="event.kind + '-' + event.company.id + '-' + event.at" class="event">
        <div>
          <strong>{{ event.label }}</strong>
          <div class="muted">
            {{ new Date(event.at).toLocaleString('de-DE') }} · {{ event.company.name }}
            <span v-if="event.company.role"> — {{ event.company.role }}</span>
          </div>
        </div>

        <button type="button" class="ghost" @click="emit('open', event.company)">Öffnen</button>
      </article>
    </div>
  </section>
</template>

<style scoped>
.calendar-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.event-list {
  display: grid;
  gap: 12px;
}

.event {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
}

.muted {
  opacity: 0.8;
}
</style>
