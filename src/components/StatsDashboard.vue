<script setup lang="ts">
import { computed } from 'vue'
import { STATUSES, type Company, type CompanyStatus } from '../types/company'

const props = defineProps<{
  companies: Company[]
}>()

const STATUS_LABELS: Record<CompanyStatus, string> = {
  Interested: 'Interessiert',
  Applied: 'Beworben',
  Interviewing: 'Im Gespräch',
  Offer: 'Angebot',
  Rejected: 'Absage',
  Archived: 'Archiv',
}

const getTodayLocalIsoDate = () => {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 10)
}

const total = computed(() => props.companies.length)

const countByStatus = computed(() => {
  const counts: Partial<Record<CompanyStatus, number>> = {}
  for (const status of STATUSES) {
    counts[status] = 0
  }
  for (const c of props.companies) {
    counts[c.status] = (counts[c.status] ?? 0) + 1
  }
  return counts as Record<CompanyStatus, number>
})

const overdueFollowUps = computed(() => {
  const today = getTodayLocalIsoDate()
  return props.companies.filter((c) => c.nextFollowUpDate && c.nextFollowUpDate < today).length
})

const deadlinesThisWeek = computed(() => {
  const today = getTodayLocalIsoDate()
  const in7 = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
  return props.companies.filter(
    (c) => c.applicationDeadline && c.applicationDeadline >= today && c.applicationDeadline <= in7,
  ).length
})

const responseRate = computed(() => {
  const applied = countByStatus.value['Applied'] ?? 0
  const interviewing = countByStatus.value['Interviewing'] ?? 0
  const offer = countByStatus.value['Offer'] ?? 0
  const rejected = countByStatus.value['Rejected'] ?? 0
  const responded = interviewing + offer + rejected
  if (applied === 0) return null
  return Math.round((responded / applied) * 100)
})
</script>

<template>
  <div>
    <h2 style="margin-top: 0; margin-bottom: 1rem;">Statistiken</h2>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-number">{{ total }}</div>
        <div class="stat-label">Bewerbungen gesamt</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ overdueFollowUps }}</div>
        <div class="stat-label">Überfällige Follow-ups</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ deadlinesThisWeek }}</div>
        <div class="stat-label">Deadlines diese Woche</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ responseRate !== null ? responseRate + '%' : '—' }}</div>
        <div class="stat-label">Rückmeldungsrate</div>
      </div>
    </div>

    <div class="stats-grid">
      <div v-for="status in STATUSES" :key="status" class="stat-card">
        <div class="stat-number">{{ countByStatus[status] }}</div>
        <div class="stat-label">{{ STATUS_LABELS[status] }}</div>
      </div>
    </div>
  </div>
</template>
