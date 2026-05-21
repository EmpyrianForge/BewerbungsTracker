# Standort-Auswahl im Onboarding

**Datum:** 2026-05-20  
**Status:** Genehmigt

## Ziel

Das bestehende Onboarding-Modal wird um eine Standortauswahl erweitert. Nutzer wählen auf einem einzigen Bildschirm sowohl ihren Standort (Würzburg und/oder Schweinfurt) als auch ihren Ausbildungsberuf. Beide Felder sind Pflicht. Die gewählten Standorte bestimmen, welche Beispielfirmen geladen werden.

## Anforderungen

- Min. 1 Standort wählen (Multi-Select), max. 2 (Würzburg + Schweinfurt)
- Genau 1 Beruf wählen (Single-Select)
- "Weiter"-Button ist disabled bis beide Bedingungen erfüllt sind
- "Ohne Beispieldaten starten" bleibt erhalten und überspringt beide Anforderungen
- Schweinfurt bekommt eigene Seed-JSONs pro Beruf (Dateien werden später geliefert)
- Wenn beide Standorte gewählt: Seed-Daten beider Standorte werden geladen und gemergt
- Bestehende Nutzer ohne Location-Key erhalten stillen Default `['WÜRZBURG']`

## Komponente: OnboardingModal.vue

### State
```ts
const selectedLocations = ref<string[]>([])
const selectedTrack = ref<string | null>(null)
const isValid = computed(() => selectedLocations.value.length > 0 && selectedTrack.value !== null)
```

### Layout (top → bottom)
1. Header (unverändert)
2. **Standort-Zeile** — zwei Toggle-Pills: "Würzburg" / "Schweinfurt"
   - Klick toggelt An/Aus
   - Aktive Pills: farbiger Rand + gefüllter Hintergrund (accent-Farbe)
3. **Berufskarten** (3 Karten) — jetzt mit klickbarem Auswahlzustand
   - Ausgewählte Karte: farbiger Rand + leicht eingefärbter Hintergrund (track-color)
   - Klick wählt aus (ersetzt vorherigen Direktemit)
4. **"Weiter"-Button** — primärer Button, disabled wenn `!isValid`
5. **"Ohne Beispieldaten starten"** — unverändert

### Emit-Signatur
```ts
defineEmits<{
  select: [track: string, locations: string[]]
}>()
// Weiter: emit('select', selectedTrack, selectedLocations)
// Skip:   emit('select', 'NONE', [])
```

## App.vue Änderungen

### Neuer localStorage-Key
```ts
const LOCATION_KEY = 'apply-tracker.location.v1'  // speichert string[] als JSON
```

### SEED_URLS wird 2D-Map
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

### Seed-Logik
```ts
const seedForLocationsAndType = async (locations: string[], track: string) => {
  // Für jede Location: URL laden, importieren, mergen
  // Fehler pro Location einzeln abfangen (eine fehlende Datei blockiert nicht die andere)
}
```

### Handler-Update
```ts
// vorher: selectTrainingType(type: string)
// nachher:
const selectOnboarding = async (track: string, locations: string[]) => {
  localStorage.setItem(TRAINING_TYPE_KEY, track)
  localStorage.setItem(LOCATION_KEY, JSON.stringify(locations))
  trainingType.value = track
  selectedLocations.value = locations
  showOnboarding.value = false
  if (track !== 'NONE') await seedForLocationsAndType(locations, track)
}
```

### Rückwärtskompatibilität
Beim App-Start: Falls `TRAINING_TYPE_KEY` gesetzt aber kein `LOCATION_KEY` → setze `LOCATION_KEY = '["WÜRZBURG"]'` still, kein erneutes Onboarding.

### Reset
`handleResetTrainingType` löscht zusätzlich `LOCATION_KEY`.

## Seed-Dateien

Folgende Dateien werden als Platzhalter in `public/` angelegt (leere Arrays bis echte Daten geliefert werden):
- `public/seed-schweinfurt-fiae.json`
- `public/seed-schweinfurt-fisi.json`
- `public/seed-schweinfurt-buma.json`

## Nicht in Scope

- Standort-Filterung im Tracker selbst (nur Seeding ist betroffen)
- Mehr als 2 Standorte
- Mehrere Berufe gleichzeitig wählen
