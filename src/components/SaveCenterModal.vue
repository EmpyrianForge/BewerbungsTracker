<script setup lang="ts">
import type { BackupMeta } from '../composables/useBackups'

defineProps<{
  modelValue: boolean
  lastSavedAt: Date | null
  storageError: string | null
  backups: BackupMeta[]
  fsSupported: boolean
  fileName: string
  fileConnected: boolean
  fileNeedsReconnect: boolean
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (event: 'restore', id: number): void
  (event: 'download'): void
  (event: 'choose-file'): void
  (event: 'reconnect-file'): void
}>()

const close = () => emit('update:modelValue', false)

const formatDate = (iso: string): string => {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  const time = d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  if (d.toDateString() === today.toDateString()) return `Heute, ${time} Uhr`
  if (d.toDateString() === yesterday.toDateString()) return `Gestern, ${time} Uhr`
  return `${d.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}, ${time} Uhr`
}
</script>

<template>
  <Transition name="fade-slide">
    <div v-if="modelValue" class="overlay" @click.self="close" @keydown.esc="close">
      <div class="modal save-center" role="dialog" aria-modal="true" aria-labelledby="save-center-title">
        <header class="modal-header">
          <h2 id="save-center-title">Speichern &amp; Sicherungen</h2>
          <button type="button" class="ghost" @click="close">Schließen</button>
        </header>

        <section class="sc-status" :class="storageError ? 'sc-status--error' : 'sc-status--ok'">
          <template v-if="storageError">
            <strong>⚠ Achtung: Deine letzten Änderungen konnten nicht gespeichert werden.</strong>
            <p>{{ storageError }}</p>
            <button type="button" class="primary" @click="emit('download')">Jetzt Sicherungskopie herunterladen</button>
          </template>
          <template v-else>
            <strong>✓ Alles gespeichert.</strong>
            <p>
              Du musst nichts tun: Jede Änderung wird sofort automatisch gespeichert<span v-if="lastSavedAt">
              (zuletzt um {{ lastSavedAt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }} Uhr)</span>.
              Du kannst den Browser jederzeit schließen.
            </p>
          </template>
        </section>

        <section class="sc-section">
          <h3>Automatische Sicherungen</h3>
          <p class="sc-hint">
            Die App legt im Hintergrund regelmäßig Sicherungen an. Wenn etwas schiefgegangen ist,
            kannst du hier zu einem früheren Stand zurück. Dein aktueller Stand wird vorher ebenfalls gesichert.
          </p>
          <p v-if="!backups.length" class="sc-empty">Noch keine Sicherungen vorhanden – die erste entsteht automatisch.</p>
          <ul v-else class="sc-list">
            <li v-for="b in backups" :key="b.id">
              <div>
                <strong>{{ formatDate(b.createdAt) }}</strong>
                <span class="sc-meta">{{ b.count }} {{ b.count === 1 ? 'Bewerbung' : 'Bewerbungen' }} · {{ b.reason }}</span>
              </div>
              <button type="button" class="ghost" @click="emit('restore', b.id)">Wiederherstellen</button>
            </li>
          </ul>
        </section>

        <section class="sc-section">
          <h3>Sicherungskopie auf dem PC</h3>
          <p class="sc-hint">
            Die Daten liegen nur in diesem Browser. Lade ab und zu eine Sicherungskopie herunter, z. B. bevor du
            den Browser-Verlauf löschst oder den PC wechselst. Mit „⋯ → Daten importieren“ holst du sie zurück.
          </p>
          <button type="button" class="primary" @click="emit('download')">⬇ Sicherungskopie herunterladen</button>
        </section>

        <section v-if="fsSupported" class="sc-section">
          <h3>Zusätzlich in eine Datei speichern (optional)</h3>
          <p v-if="fileConnected" class="sc-hint">✓ Jede Änderung wird auch in <strong>{{ fileName }}</strong> gespeichert.</p>
          <template v-else-if="fileNeedsReconnect">
            <p class="sc-hint">Die Datei <strong>{{ fileName }}</strong> ist gerade nicht verbunden. Ein Klick genügt:</p>
            <button type="button" class="primary" @click="emit('reconnect-file')">Datei wieder verbinden</button>
          </template>
          <template v-else>
            <p class="sc-hint">Wenn du möchtest, speichert die App jede Änderung zusätzlich in eine Datei, z. B. auf dem Desktop oder in OneDrive.</p>
            <button type="button" class="ghost" @click="emit('choose-file')">Datei auswählen</button>
          </template>
        </section>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.save-center {
  width: min(620px, 100%);
}

.sc-status {
  padding: 0.85rem 1rem;
  border-radius: 10px;
  margin-bottom: 1rem;
}

.sc-status p {
  margin: 0.35rem 0 0;
}

.sc-status .primary {
  margin-top: 0.6rem;
}

.sc-status--ok {
  border: 1px solid #86efac;
  background: color-mix(in srgb, #22c55e 10%, var(--surface));
}

.sc-status--error {
  border: 1px solid #fca5a5;
  background: color-mix(in srgb, #ef4444 10%, var(--surface));
}

.sc-section {
  padding-top: 0.9rem;
  margin-top: 0.9rem;
  border-top: 1px solid var(--border);
}

.sc-section h3 {
  margin: 0 0 0.35rem;
  font-size: 1rem;
}

.sc-hint {
  margin: 0 0 0.6rem;
  font-size: 0.88rem;
  color: var(--text-muted);
}

.sc-empty {
  font-size: 0.88rem;
}

.sc-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.4rem;
  max-height: 260px;
  overflow: auto;
}

.sc-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.5rem 0.7rem;
  border: 1px solid var(--border);
  border-radius: 8px;
}

.sc-list li div {
  display: grid;
}

.sc-meta {
  font-size: 0.8rem;
  color: var(--text-muted);
}
</style>
