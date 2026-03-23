<script setup lang="ts">
import { computed } from 'vue'
import { STATUSES, PRIORITIES, type Company, type CompanyStatus, type Priority } from '../types/company'

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

const STATUS_COLORS: Record<CompanyStatus, string> = {
  Interested: '#3b82f6',
  Applied: '#8b5cf6',
  Interviewing: '#f59e0b',
  Offer: '#10b981',
  Rejected: '#ef4444',
  Archived: '#9ca3af',
}

const PRIORITY_LABELS: Record<Priority, string> = {
  High: 'Hoch',
  Medium: 'Mittel',
  Low: 'Niedrig',
}

const PRIORITY_COLORS: Record<Priority, string> = {
  High: '#ef4444',
  Medium: '#f59e0b',
  Low: '#10b981',
}

const getTodayLocalIsoDate = () => {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10)
}

// ── KPI ──────────────────────────────────────────────────────
const total = computed(() => props.companies.length)

const countByStatus = computed(() => {
  const counts = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<CompanyStatus, number>
  for (const c of props.companies) counts[c.status]++
  return counts
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
  const applied = countByStatus.value['Applied']
  const responded = countByStatus.value['Interviewing'] + countByStatus.value['Offer'] + countByStatus.value['Rejected']
  if (applied === 0) return null
  return Math.round((responded / applied) * 100)
})

// ── Status bar chart ─────────────────────────────────────────
const maxStatusCount = computed(() => Math.max(1, ...STATUSES.map((s) => countByStatus.value[s])))

const statusBars = computed(() =>
  STATUSES.map((status) => ({
    status,
    label: STATUS_LABELS[status],
    count: countByStatus.value[status],
    pct: Math.round((countByStatus.value[status] / maxStatusCount.value) * 100),
    color: STATUS_COLORS[status],
  })),
)

// ── Priority donut ───────────────────────────────────────────
const countByPriority = computed(() => {
  const counts = Object.fromEntries(PRIORITIES.map((p) => [p, 0])) as Record<Priority, number>
  for (const c of props.companies) counts[c.priority]++
  return counts
})

const donutSegments = computed(() => {
  const t = total.value
  if (t === 0) return []

  const r = 45
  const circumference = 2 * Math.PI * r
  let angle = -90

  return PRIORITIES.filter((p) => countByPriority.value[p] > 0).map((priority) => {
    const count = countByPriority.value[priority]
    const fraction = count / t
    const dash = fraction * circumference
    const gap = circumference - dash
    const rotation = angle
    angle += fraction * 360
    return { priority, count, dash, gap, rotation, color: PRIORITY_COLORS[priority] }
  })
})

// ── Monthly activity ─────────────────────────────────────────
const monthlyActivity = computed(() => {
  const now = new Date()
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const y = d.getFullYear()
    const m = d.getMonth()
    return {
      label: d.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' }),
      count: props.companies.filter((c) => {
        const cd = new Date(c.createdAt)
        return cd.getFullYear() === y && cd.getMonth() === m
      }).length,
    }
  })
})

const maxMonthly = computed(() => Math.max(1, ...monthlyActivity.value.map((m) => m.count)))
</script>

<template>
  <div class="stats-dashboard">
    <h2 class="stats-title">Statistiken</h2>

    <!-- KPI cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-number">{{ total }}</div>
        <div class="stat-label">Gesamt</div>
      </div>
      <div class="stat-card" :class="{ 'stat-card--warn': overdueFollowUps > 0 }">
        <div class="stat-number">{{ overdueFollowUps }}</div>
        <div class="stat-label">Überfällige Follow-ups</div>
      </div>
      <div class="stat-card" :class="{ 'stat-card--warn': deadlinesThisWeek > 0 }">
        <div class="stat-number">{{ deadlinesThisWeek }}</div>
        <div class="stat-label">Deadlines diese Woche</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ responseRate !== null ? responseRate + '%' : '—' }}</div>
        <div class="stat-label">Rückmeldungsrate</div>
      </div>
    </div>

    <!-- Charts row -->
    <div class="charts-row">

      <!-- Status bar chart -->
      <div class="chart-card chart-card--bars">
        <h3 class="chart-title">Status-Verteilung</h3>
        <div v-if="total === 0" class="chart-empty">Keine Daten</div>
        <div v-else class="bar-list">
          <div v-for="bar in statusBars" :key="bar.status" class="bar-row">
            <span class="bar-label">{{ bar.label }}</span>
            <div class="bar-track">
              <div
                class="bar-fill"
                :style="{ width: bar.pct + '%', background: bar.color }"
              ></div>
            </div>
            <span class="bar-count">{{ bar.count }}</span>
          </div>
        </div>
      </div>

      <!-- Priority donut -->
      <div class="chart-card chart-card--donut">
        <h3 class="chart-title">Priorität</h3>
        <div v-if="total === 0" class="chart-empty">Keine Daten</div>
        <template v-else>
          <svg viewBox="0 0 120 120" class="donut-svg" aria-hidden="true">
            <!-- track -->
            <circle cx="60" cy="60" r="45" fill="none" stroke-width="20" class="donut-track" />
            <!-- segments -->
            <circle
              v-for="seg in donutSegments"
              :key="seg.priority"
              cx="60" cy="60" r="45"
              fill="none"
              stroke-width="20"
              :stroke="seg.color"
              :stroke-dasharray="`${seg.dash} ${seg.gap}`"
              :transform="`rotate(${seg.rotation} 60 60)`"
              stroke-linecap="butt"
            />
            <!-- center label -->
            <text x="60" y="56" text-anchor="middle" class="donut-center-num">{{ total }}</text>
            <text x="60" y="70" text-anchor="middle" class="donut-center-label">gesamt</text>
          </svg>
          <div class="donut-legend">
            <div v-for="p in PRIORITIES" :key="p" class="donut-legend-item">
              <span class="donut-legend-dot" :style="{ background: PRIORITY_COLORS[p] }"></span>
              <span class="donut-legend-text">{{ PRIORITY_LABELS[p] }}</span>
              <span class="donut-legend-count">{{ countByPriority[p] }}</span>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Monthly activity chart -->
    <div class="chart-card chart-card--monthly">
      <h3 class="chart-title">Aktivität — letzte 6 Monate</h3>
      <div v-if="total === 0" class="chart-empty">Keine Daten</div>
      <div v-else class="month-chart">
        <div v-for="month in monthlyActivity" :key="month.label" class="month-col">
          <span class="month-count">{{ month.count > 0 ? month.count : '' }}</span>
          <div class="month-bar-wrap">
            <div
              class="month-bar"
              :style="{ height: (month.count / maxMonthly * 100) + '%' }"
            ></div>
          </div>
          <span class="month-label">{{ month.label }}</span>
        </div>
      </div>
    </div>

  </div>
</template>
