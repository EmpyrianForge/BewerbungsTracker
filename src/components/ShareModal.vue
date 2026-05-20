<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Company } from '../types/company'
import { encodeSharePayload } from '../utils/share'

const props = defineProps<{
  modelValue: boolean
  companies: Company[]
  trainingType?: string
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
}>()

const shareUrl = ref('')
const generating = ref(false)
const copied = ref(false)

const generate = async () => {
  generating.value = true
  try {
    const encoded = await encodeSharePayload(props.companies, props.trainingType)
    shareUrl.value = `${window.location.origin}${window.location.pathname}#share=${encoded}`
  } finally {
    generating.value = false
  }
}

const openLink = () => {
  window.open(shareUrl.value, '_blank', 'noopener,noreferrer')
}

const copy = async () => {
  try {
    await navigator.clipboard.writeText(shareUrl.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2500)
  } catch {
    /* ignore */
  }
}

watch(() => props.modelValue, (val) => { if (val) generate() })

const close = () => emit('update:modelValue', false)
</script>

<template>
  <Transition name="fade-slide">
    <div v-if="modelValue" class="overlay" @click.self="close">
      <div class="modal share-modal" role="dialog" aria-modal="true" aria-labelledby="share-modal-title">
        <header class="modal-header">
          <h2 id="share-modal-title">Ansicht teilen</h2>
          <button type="button" class="ghost" @click="close">Schließen</button>
        </header>

        <div class="share-body">
          <p class="share-info">
            Dieser Link enthält eine <strong>komprimierte Momentaufnahme</strong> deiner Bewerbungen.
            Die Standortleitung kann ihn im Browser öffnen – ohne Anmeldung, ohne Server.
            Es werden <strong>keine persönlichen Daten</strong> auf fremde Server übertragen.
          </p>

          <div v-if="generating" class="share-generating">
            Link wird erzeugt …
          </div>

          <template v-else>
            <div class="share-url-wrap">
              <input
                class="share-url-input"
                :value="shareUrl"
                readonly
                aria-label="Teilungs-Link"
                @focus="($event.target as HTMLInputElement).select()"
              />
              <button type="button" class="primary" @click="copy">
                {{ copied ? 'Kopiert!' : 'Kopieren' }}
              </button>
              <button type="button" class="ghost" @click="openLink" title="Im Browser öffnen">
                ↗
              </button>
            </div>

            <p class="share-meta">
              {{ companies.length }} Einträge · erzeugt {{ new Date().toLocaleDateString('de-DE') }}
            </p>

            <div class="share-hint">
              <strong>Hinweis:</strong> Der Link spiegelt den Stand zum Zeitpunkt des Klickens wider.
              Wenn du neue Bewerbungen einträgst, erzeuge einfach einen neuen Link.
            </div>
          </template>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.share-modal {
  max-width: 560px;
}

.share-body {
  padding: 0 1.25rem 1.25rem;
}

.share-info {
  font-size: 0.88rem;
  color: var(--text-muted);
  margin-bottom: 1rem;
  line-height: 1.55;
}

.share-generating {
  text-align: center;
  color: var(--text-muted);
  padding: 1.5rem 0;
  font-size: 0.9rem;
}

.share-url-wrap {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.share-url-input {
  flex: 1;
  font-size: 0.78rem;
  font-family: monospace;
  padding: 0.45rem 0.65rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--bg);
  color: var(--text);
  min-width: 0;
}

.share-meta {
  font-size: 0.78rem;
  color: var(--text-muted);
  margin: 0.5rem 0 0.75rem;
}

.share-hint {
  font-size: 0.82rem;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 6px;
  padding: 0.6rem 0.85rem;
  line-height: 1.5;
}
</style>
