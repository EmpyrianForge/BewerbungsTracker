# Standort-Auswahl im Onboarding — Implementierungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Onboarding-Modal um Standortauswahl (Würzburg / Schweinfurt, Multi-Select) erweitern — Beruf und Standort auf einem Bildschirm, beide Pflicht.

**Architecture:** `OnboardingModal.vue` erhält internen State für `selectedLocations[]` und `selectedTrack`, emittiert beide Werte zusammen. `App.vue` bekommt eine 2D SEED_URLS-Map und eine neue `seedForLocationsAndType`-Funktion, die für jeden gewählten Standort die passende JSON lädt und merged. Standort wird in eigenem localStorage-Key gespeichert.

**Tech Stack:** Vue 3 (Composition API), TypeScript, Vite — kein Test-Framework vorhanden, Verifikation manuell im Browser.

---

## Betroffene Dateien

| Datei | Aktion |
|-------|--------|
| `public/seed-schweinfurt-fiae.json` | Neu erstellen (Platzhalter) |
| `public/seed-schweinfurt-fisi.json` | Neu erstellen (Platzhalter) |
| `public/seed-schweinfurt-buma.json` | Neu erstellen (Platzhalter) |
| `src/components/OnboardingModal.vue` | Vollständig überarbeiten |
| `src/App.vue` | Konstanten, Logik und Template anpassen |

---

## Task 1: Schweinfurt Placeholder-Seed-Dateien anlegen

**Files:**
- Create: `public/seed-schweinfurt-fiae.json`
- Create: `public/seed-schweinfurt-fisi.json`
- Create: `public/seed-schweinfurt-buma.json`

- [ ] **Step 1: `seed-schweinfurt-fiae.json` anlegen**

Inhalt: leeres Array — wird später mit echten Firmen befüllt.

```json
[]
```

Speichern unter: `public/seed-schweinfurt-fiae.json`

- [ ] **Step 2: `seed-schweinfurt-fisi.json` anlegen**

```json
[]
```

Speichern unter: `public/seed-schweinfurt-fisi.json`

- [ ] **Step 3: `seed-schweinfurt-buma.json` anlegen**

```json
[]
```

Speichern unter: `public/seed-schweinfurt-buma.json`

- [ ] **Step 4: Commit**

```bash
git add public/seed-schweinfurt-fiae.json public/seed-schweinfurt-fisi.json public/seed-schweinfurt-buma.json
git commit -m "feat: add Schweinfurt seed placeholder files"
```

---

## Task 2: OnboardingModal.vue — Script-Block ersetzen

**Files:**
- Modify: `src/components/OnboardingModal.vue`

Der bisherige `<script setup>` wird vollständig ersetzt. Die Cards emittieren nicht mehr direkt — stattdessen setzen sie den lokalen State.

- [ ] **Step 1: `<script setup>` ersetzen**

Den gesamten `<script setup lang="ts">` Block in `OnboardingModal.vue` durch folgenden Code ersetzen:

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

const emit = defineEmits<{
  select: [track: string, locations: string[]]
}>()

const locationOptions = [
  { key: 'WÜRZBURG', label: 'Würzburg' },
  { key: 'SCHWEINFURT', label: 'Schweinfurt' },
]

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

const selectedLocations = ref<string[]>([])
const selectedTrack = ref<string | null>(null)

const isValid = computed(() => selectedLocations.value.length > 0 && selectedTrack.value !== null)

const toggleLocation = (key: string) => {
  const idx = selectedLocations.value.indexOf(key)
  if (idx === -1) {
    selectedLocations.value = [...selectedLocations.value, key]
  } else {
    selectedLocations.value = selectedLocations.value.filter((l) => l !== key)
  }
}

const confirm = () => {
  if (!isValid.value || !selectedTrack.value) return
  emit('select', selectedTrack.value, [...selectedLocations.value])
}
</script>
```

---

## Task 3: OnboardingModal.vue — Template ersetzen

**Files:**
- Modify: `src/components/OnboardingModal.vue`

- [ ] **Step 1: `<template>` ersetzen**

Den gesamten `<template>` Block ersetzen:

```vue
<template>
  <div class="onboarding-overlay">
    <div class="onboarding-modal">
      <div class="onboarding-header">
        <h1 class="onboarding-title">Willkommen beim Bewerbungs-Tracker</h1>
        <p class="onboarding-lead">Wähle deinen Standort und Ausbildungsberuf — wir laden passende Beispielfirmen für deinen Einstieg.</p>
      </div>

      <!-- Standortauswahl -->
      <div class="onboarding-section">
        <p class="onboarding-section-label">Standort <span class="onboarding-required">(mind. 1)</span></p>
        <div class="onboarding-location-row">
          <button
            v-for="loc in locationOptions"
            :key="loc.key"
            type="button"
            class="onboarding-location-pill"
            :class="{ 'onboarding-location-pill--active': selectedLocations.includes(loc.key) }"
            @click="toggleLocation(loc.key)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            {{ loc.label }}
          </button>
        </div>
      </div>

      <!-- Berufsauswahl -->
      <div class="onboarding-section">
        <p class="onboarding-section-label">Ausbildungsberuf <span class="onboarding-required">(genau 1)</span></p>
        <div class="onboarding-cards">
          <button
            v-for="track in tracks"
            :key="track.key"
            type="button"
            class="onboarding-card"
            :class="{ 'onboarding-card--selected': selectedTrack === track.key }"
            :style="{ '--track-color': track.color }"
            @click="selectedTrack = track.key"
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
      </div>

      <button
        type="button"
        class="onboarding-confirm"
        :disabled="!isValid"
        @click="confirm"
      >
        Weiter
      </button>

      <button type="button" class="onboarding-skip" @click="emit('select', 'NONE', [])">
        Ohne Beispieldaten starten
      </button>
    </div>
  </div>
</template>
```

---

## Task 4: OnboardingModal.vue — Styles ergänzen

**Files:**
- Modify: `src/components/OnboardingModal.vue`

- [ ] **Step 1: Neue CSS-Klassen in `<style scoped>` einfügen**

Am Ende des bestehenden `<style scoped>` Blocks (vor dem schließenden `</style>`) folgende Klassen einfügen:

```css
.onboarding-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.onboarding-section-label {
  margin: 0;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.onboarding-required {
  font-weight: 400;
  text-transform: none;
  letter-spacing: 0;
}

.onboarding-location-row {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.onboarding-location-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  background: var(--surface-muted);
  border: 2px solid var(--border);
  border-radius: 999px;
  cursor: pointer;
  color: var(--text);
  font-size: 0.88rem;
  font-weight: 500;
  transition: border-color 0.15s, background 0.15s, color 0.15s;
}

.onboarding-location-pill:hover {
  border-color: var(--accent);
}

.onboarding-location-pill--active {
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  color: var(--accent);
}

.onboarding-card--selected {
  border-color: var(--track-color, var(--accent));
  background: color-mix(in srgb, var(--track-color, var(--accent)) 8%, var(--surface));
}

.onboarding-confirm {
  width: 100%;
  padding: 0.7rem 1.5rem;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
}

.onboarding-confirm:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.onboarding-confirm:not(:disabled):hover {
  opacity: 0.88;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/OnboardingModal.vue
git commit -m "feat: onboarding modal with location + track selection"
```

---

## Task 5: App.vue — Konstanten aktualisieren

**Files:**
- Modify: `src/App.vue`

- [ ] **Step 1: `LOCATION_KEY` Konstante hinzufügen**

Nach der Zeile `const SEED_IDS_KEY = 'apply-tracker.seed-ids.v1'` folgende Zeile einfügen:

```ts
const LOCATION_KEY = 'apply-tracker.location.v1'
```

- [ ] **Step 2: `SEED_URLS` durch 2D-Map ersetzen**

Die bestehende `SEED_URLS`-Konstante:
```ts
const SEED_URLS: Record<string, string> = {
  FIAE: '/bewerbungstracker-import.json',
  FISI: '/seed-fisi.json',
  BUMA: '/seed-buma.json',
}
```

ersetzen durch:

```ts
const SEED_URLS: Record<string, Record<string, string>> = {
  WÜRZBURG: {
    FIAE: '/bewerbungstracker-import.json',
    FISI: '/seed-fisi.json',
    BUMA: '/seed-buma.json',
  },
  SCHWEINFURT: {
    FIAE: '/seed-schweinfurt-fiae.json',
    FISI: '/seed-schweinfurt-fisi.json',
    BUMA: '/seed-schweinfurt-buma.json',
  },
}
```

- [ ] **Step 3: `selectedLocations` Ref hinzufügen**

Nach der Zeile `const trainingType = ref<string>(localStorage.getItem(TRAINING_TYPE_KEY) ?? '')` folgende Zeile einfügen:

```ts
const selectedLocations = ref<string[]>(
  JSON.parse(localStorage.getItem(LOCATION_KEY) ?? '[]')
)
```

---

## Task 6: App.vue — Seed-Logik ersetzen

**Files:**
- Modify: `src/App.vue`

- [ ] **Step 1: `seedForType` durch `seedForLocationsAndType` ersetzen**

Die bestehende Funktion `seedForType`:

```ts
const seedForType = async (type: string) => {
  const url = SEED_URLS[type]
  if (!url) return
  try {
    const resp = await fetch(url)
    if (!resp.ok) {
      seedError.value = 'Beispieldaten konnten nicht geladen werden (Verbindungsfehler). Du kannst trotzdem loslegen und Firmen manuell eintragen.'
      return
    }
    const imported = importCompaniesFromJson(await resp.text())
    const now = new Date().toISOString()
    const normalized = imported.map((c) => ({ ...c, createdAt: now, updatedAt: now }))

    // Remove previously seeded companies before adding the new ones
    const prevSeedIds: string[] = JSON.parse(localStorage.getItem(SEED_IDS_KEY) ?? '[]')
    if (prevSeedIds.length) removeCompaniesById(prevSeedIds)

    if (normalized.length) {
      mergeImportedCompanies(normalized)
      localStorage.setItem(SEED_IDS_KEY, JSON.stringify(normalized.map((c) => c.id)))
    }
  } catch {
    seedError.value = 'Beispieldaten konnten nicht geladen werden. Du kannst trotzdem loslegen und Firmen manuell eintragen.'
  }
}
```

vollständig ersetzen durch:

```ts
const seedForLocationsAndType = async (locs: string[], track: string) => {
  const now = new Date().toISOString()

  const prevSeedIds: string[] = JSON.parse(localStorage.getItem(SEED_IDS_KEY) ?? '[]')
  if (prevSeedIds.length) removeCompaniesById(prevSeedIds)

  const allNewIds: string[] = []

  for (const loc of locs) {
    const url = SEED_URLS[loc]?.[track]
    if (!url) continue
    try {
      const resp = await fetch(url)
      if (!resp.ok) {
        seedError.value = 'Beispieldaten konnten nicht geladen werden (Verbindungsfehler). Du kannst trotzdem loslegen und Firmen manuell eintragen.'
        continue
      }
      const imported = importCompaniesFromJson(await resp.text())
      const normalized = imported.map((c) => ({ ...c, createdAt: now, updatedAt: now }))
      if (normalized.length) {
        mergeImportedCompanies(normalized)
        allNewIds.push(...normalized.map((c) => c.id))
      }
    } catch {
      seedError.value = 'Beispieldaten konnten nicht geladen werden. Du kannst trotzdem loslegen und Firmen manuell eintragen.'
    }
  }

  if (allNewIds.length) {
    localStorage.setItem(SEED_IDS_KEY, JSON.stringify(allNewIds))
  }
}
```

---

## Task 7: App.vue — Handler und Reset aktualisieren

**Files:**
- Modify: `src/App.vue`

- [ ] **Step 1: `selectTrainingType` durch `selectOnboarding` ersetzen**

Die bestehende Funktion:

```ts
const selectTrainingType = async (type: string) => {
  localStorage.setItem(TRAINING_TYPE_KEY, type)
  trainingType.value = type
  showOnboarding.value = false
  if (type !== 'NONE') await seedForType(type)
}
```

ersetzen durch:

```ts
const selectOnboarding = async (track: string, locations: string[]) => {
  localStorage.setItem(TRAINING_TYPE_KEY, track)
  localStorage.setItem(LOCATION_KEY, JSON.stringify(locations))
  trainingType.value = track
  selectedLocations.value = locations
  showOnboarding.value = false
  if (track !== 'NONE') await seedForLocationsAndType(locations, track)
}
```

- [ ] **Step 2: `handleResetTrainingType` — Location-Key mit löschen**

In der Funktion `handleResetTrainingType` nach `localStorage.removeItem(TRAINING_TYPE_KEY)` folgende Zeile einfügen:

```ts
localStorage.removeItem(LOCATION_KEY)
```

---

## Task 8: App.vue — Rückwärtskompatibilität und Template

**Files:**
- Modify: `src/App.vue`

- [ ] **Step 1: Backwards-Compat in `onMounted` einfügen**

In der `onMounted`-Funktion, direkt **vor** der Zeile:
```ts
const isShareLink = window.location.hash.startsWith('#share=')
```
folgende Zeilen einfügen:

```ts
// Backwards compat: existing users with training type but no location default to Würzburg
if (localStorage.getItem(TRAINING_TYPE_KEY) && !localStorage.getItem(LOCATION_KEY)) {
  localStorage.setItem(LOCATION_KEY, JSON.stringify(['WÜRZBURG']))
  selectedLocations.value = ['WÜRZBURG']
}
```

- [ ] **Step 2: Template — `OnboardingModal` Binding aktualisieren**

Im Template die Zeile:
```html
<OnboardingModal v-if="showOnboarding" @select="selectTrainingType" />
```

ersetzen durch:
```html
<OnboardingModal v-if="showOnboarding" @select="selectOnboarding" />
```

- [ ] **Step 3: TypeScript prüfen**

```bash
cd BewerbungsTracker
npx vue-tsc --noEmit
```

Erwartetes Ergebnis: keine Fehler. Falls Fehler auftreten, sind sie im Output beschrieben und einzeln zu beheben.

- [ ] **Step 4: Commit**

```bash
git add src/App.vue
git commit -m "feat: wire location+track onboarding into App.vue"
```

---

## Task 9: Manuelle Verifikation im Browser

**Files:** keine Änderungen

- [ ] **Step 1: Dev-Server starten**

```bash
cd BewerbungsTracker
npm run dev
```

Öffne `http://localhost:5173` im Browser.

- [ ] **Step 2: Onboarding erscheint beim ersten Start**

LocalStorage leeren: DevTools → Application → Local Storage → alle Keys mit `apply-tracker` löschen. Seite neu laden.

Erwartetes Verhalten:
- Modal erscheint mit Standort-Pills (Würzburg, Schweinfurt) und 3 Berufskarten
- "Weiter"-Button ist ausgegraut

- [ ] **Step 3: Validierung testen**

- Nur Standort wählen → "Weiter" bleibt disabled
- Nur Beruf wählen → "Weiter" bleibt disabled
- Beide wählen → "Weiter" wird aktiv (nicht mehr ausgegraut)

- [ ] **Step 4: Beide Standorte gleichzeitig wählen**

Würzburg + Schweinfurt aktivieren, einen Beruf wählen, "Weiter" klicken.
Tracker-Liste erscheint. Da Schweinfurt-Seeddateien noch leer sind, kommen nur Würzburg-Firmen — kein Fehler.

- [ ] **Step 5: "Ohne Beispieldaten starten" testen**

LocalStorage leeren, Modal öffnen, direkt "Ohne Beispieldaten starten" klicken → Tracker öffnet sich leer, kein Fehler.

- [ ] **Step 6: Reset testen**

Hilfe-Tab → Beruf-Auswahl zurücksetzen → Onboarding erscheint wieder mit leerem State.

- [ ] **Step 7: Rückwärtskompatibilität testen**

In DevTools: `apply-tracker.training-type.v1` auf `FIAE` setzen, keinen `location`-Key setzen. Seite neu laden.
Erwartetes Verhalten: kein Onboarding erscheint, `location`-Key wird automatisch auf `["WÜRZBURG"]` gesetzt.

- [ ] **Step 8: Abschließender Commit**

```bash
git add -A
git commit -m "chore: verify standort onboarding complete"
```
