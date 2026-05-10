<script setup lang="ts">
defineEmits<{ select: [type: string] }>()

const tracks = [
  {
    key: 'FIAE',
    short: 'FIAE',
    title: 'Fachinformatiker/in',
    subtitle: 'Anwendungsentwicklung',
    desc: 'Softwareentwicklung, Web-Apps, Datenbanken',
    icon: 'M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3m10 0h3a2 2 0 0 0 2-2v-3M9 9h6M9 12h6M9 15h4',
    color: '#3b82f6',
  },
  {
    key: 'FISI',
    short: 'FISI',
    title: 'Fachinformatiker/in',
    subtitle: 'Systemintegration',
    desc: 'Netzwerke, Server, IT-Infrastruktur',
    icon: 'M5 12H3M21 12h-2M12 5V3M12 21v-2M7.05 7.05 5.636 5.636M18.364 18.364l-1.414-1.414M7.05 16.95l-1.414 1.414M18.364 5.636l-1.414 1.414M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z',
    color: '#8b5cf6',
  },
  {
    key: 'BUMA',
    short: 'BÜMA',
    title: 'Kaufmann/-frau für',
    subtitle: 'Büromanagement',
    desc: 'Verwaltung, Sachbearbeitung, Office-Organisation',
    icon: 'M9 12h6M9 16h6M9 8h6M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z',
    color: '#10b981',
  },
]
</script>

<template>
  <div class="onboarding-overlay">
    <div class="onboarding-modal">
      <div class="onboarding-header">
        <h1 class="onboarding-title">Willkommen beim Bewerbungs-Tracker</h1>
        <p class="onboarding-lead">Wähle deinen Umschulungsberuf — wir laden passende Beispielfirmen für deinen Einstieg.</p>
      </div>

      <div class="onboarding-cards">
        <button
          v-for="track in tracks"
          :key="track.key"
          type="button"
          class="onboarding-card"
          :style="{ '--track-color': track.color }"
          @click="$emit('select', track.key)"
        >
          <span class="onboarding-card-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <path :d="track.icon" />
            </svg>
          </span>
          <strong class="onboarding-card-abbr">{{ track.short }}</strong>
          <span class="onboarding-card-name">{{ track.title }}<br>{{ track.subtitle }}</span>
          <span class="onboarding-card-desc">{{ track.desc }}</span>
        </button>
      </div>

      <button type="button" class="onboarding-skip" @click="$emit('select', 'NONE')">
        Ohne Beispieldaten starten
      </button>
    </div>
  </div>
</template>

<style scoped>
.onboarding-overlay {
  position: fixed;
  inset: 0;
  background: var(--overlay);
  display: grid;
  place-items: center;
  padding: 1rem;
  z-index: 100;
}

.onboarding-modal {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 2rem 1.75rem 1.5rem;
  width: min(680px, 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.75rem;
}

.onboarding-header {
  text-align: center;
}

.onboarding-title {
  margin: 0 0 0.5rem;
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--text);
}

.onboarding-lead {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.92rem;
}

.onboarding-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.85rem;
  width: 100%;
}

.onboarding-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  padding: 1.25rem 0.75rem 1rem;
  background: var(--surface-muted);
  border: 2px solid var(--border);
  border-radius: 12px;
  cursor: pointer;
  color: var(--text);
  text-align: center;
  transition: border-color 0.15s, background 0.15s, transform 0.12s;
}

.onboarding-card:hover {
  border-color: var(--track-color, var(--accent));
  background: var(--surface);
  transform: translateY(-2px);
}

.onboarding-card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--track-color, var(--accent)) 12%, transparent);
  color: var(--track-color, var(--accent));
  margin-bottom: 0.2rem;
  flex-shrink: 0;
}

.onboarding-card-abbr {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--track-color, var(--accent));
}

.onboarding-card-name {
  font-size: 0.82rem;
  line-height: 1.35;
  color: var(--text);
}

.onboarding-card-desc {
  font-size: 0.76rem;
  color: var(--text-muted);
  line-height: 1.3;
}

.onboarding-skip {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 0.82rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  text-decoration: underline;
  text-underline-offset: 2px;
  border-radius: 4px;
}

.onboarding-skip:hover {
  color: var(--text);
}

@media (max-width: 520px) {
  .onboarding-cards {
    grid-template-columns: 1fr;
  }

  .onboarding-card {
    flex-direction: row;
    text-align: left;
    padding: 0.9rem 1rem;
    gap: 0.75rem;
  }

  .onboarding-card-icon {
    width: 40px;
    height: 40px;
    flex-shrink: 0;
    margin-bottom: 0;
  }

  .onboarding-card-name,
  .onboarding-card-desc {
    text-align: left;
  }
}
</style>
