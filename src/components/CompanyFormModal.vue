<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import {
  STATUSES,
  PRIORITIES,
  APPLICATION_TYPES,
  RED_REASON_LABELS,
  type Company,
  type CompanyInput,
  type CompanyStatus,
  type Priority,
  type ApplicationType,
  type DocumentChecklist,
  type OutreachStatus,
} from "../types/company";

const STATUS_LABELS: Record<CompanyStatus, string> = {
  Interested: "Interessiert",
  Applied: "Beworben",
  Interviewing: "Im Gespräch",
  Offer: "Angebot erhalten",
  Rejected: "Absage",
  Archived: "Archiviert",
};

const PRIORITY_LABELS: Record<Priority, string> = {
  High: "Hoch",
  Medium: "Mittel",
  Low: "Niedrig",
};

const APPLICATION_TYPE_LABELS: Record<ApplicationType, string> = {
  Stellenanzeige: "Stellenanzeige",
  Initiativbewerbung: "Initiativbewerbung",
  Empfehlung: "Empfehlung",
  Sonstiges: "Sonstiges",
};

const props = defineProps<{
  modelValue: boolean;
  mode: "create" | "edit";
  company?: Company;
  preset?: Partial<CompanyInput>;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: boolean): void;
  (event: "save", value: CompanyInput): void;
}>();

const emptyDocuments = (): DocumentChecklist => ({
  cv: false,
  coverLetter: false,
  motivationLetter: false,
  certificates: false,
  portfolio: false,
  github: false,
});

const emptyForm = (): CompanyInput => ({
  name: "",
  role: "",
  location: "",
  url: "",
  contact: "",
  salaryRange: "",
  source: "",
  status: "Interested",
  notes: "",
  tags: [],
  nextFollowUpDate: undefined,
  interviewAt: undefined,
  lastActionAt: undefined,
  lastActionNote: "",
  applicationDeadline: undefined,
  priority: "Medium",
  applicationType: "Stellenanzeige",
  documents: emptyDocuments(),
  proofSentAt: undefined,
  proofUrl: "",
  proofNote: "",
  outreachStatus: "yellow" as OutreachStatus,
  redReason: undefined,
});

const form = reactive<CompanyInput>(emptyForm());
const showDetails = ref(false);
const nameError = ref(false);

const tagInput = computed({
  get: () => form.tags.join(", "),
  set: (value: string) => {
    form.tags = value
      .split(",")
      .map((item) => item.trim())
      .filter((item, index, arr) => item.length > 0 && arr.indexOf(item) === index);
  },
});

watch(
  () => props.modelValue,
  (isOpen) => {
    if (!isOpen) return;
    nameError.value = false;
    showDetails.value = false;

    const source = props.company;
    if (!source) {
      Object.assign(form, { ...emptyForm(), ...(props.preset ?? {}) });
      return;
    }

    Object.assign(form, {
      name: source.name,
      role: source.role,
      location: source.location,
      url: source.url,
      contact: source.contact,
      salaryRange: source.salaryRange,
      source: source.source,
      status: source.status,
      notes: source.notes,
      tags: [...source.tags],
      nextFollowUpDate: source.nextFollowUpDate,
      interviewAt: source.interviewAt,
      lastActionAt: source.lastActionAt,
      lastActionNote: source.lastActionNote,
      applicationDeadline: source.applicationDeadline,
      priority: source.priority,
      applicationType: source.applicationType,
      documents: { ...source.documents },
      proofSentAt: source.proofSentAt,
      proofUrl: source.proofUrl ?? "",
      proofNote: source.proofNote ?? "",
      outreachStatus: source.outreachStatus,
      redReason: source.redReason,
    });
  },
);

const close = () => emit("update:modelValue", false);

const submit = () => {
  nameError.value = !form.name.trim();
  if (nameError.value) return;

  emit("save", {
    ...form,
    name: form.name.trim(),
    role: form.role.trim(),
    location: form.location.trim(),
    url: form.url.trim(),
    contact: form.contact.trim(),
    salaryRange: form.salaryRange.trim(),
    source: form.source.trim(),
    notes: form.notes.trim(),
    nextFollowUpDate: form.nextFollowUpDate || undefined,
    interviewAt: form.interviewAt || undefined,
    lastActionAt: form.lastActionAt || undefined,
    lastActionNote: form.lastActionNote.trim(),
    applicationDeadline: form.applicationDeadline || undefined,
    proofSentAt: form.proofSentAt || undefined,
    proofUrl: form.proofUrl?.trim() || undefined,
    proofNote: form.proofNote?.trim() || undefined,
    redReason: form.outreachStatus === "red" ? form.redReason : undefined,
  });
  close();
};
</script>

<template>
  <Transition name="fade-slide">
    <div v-if="modelValue" class="overlay" @click.self="close">
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="form-modal-title">
        <header class="modal-header">
          <h2 id="form-modal-title">
            {{ mode === "create" ? "Bewerbung hinzufügen" : "Bewerbung bearbeiten" }}
          </h2>
          <button type="button" class="ghost" @click="close">Schließen</button>
        </header>

        <form class="form" @submit.prevent="submit">

          <!-- ── Pflichtangaben ── -->
          <div class="form-section-label">Pflichtangaben</div>

          <label :class="{ 'has-error': nameError }">
            Firma <span class="required-star">*</span>
            <input v-model="form.name" maxlength="120" @input="nameError = false" />
            <span v-if="nameError" class="field-error-msg">Bitte Firma angeben</span>
          </label>

          <label>
            Stelle / Position
            <input v-model="form.role" maxlength="120" />
          </label>

          <label>
            Ort
            <input v-model="form.location" maxlength="120" />
          </label>

          <label>
            Status
            <select v-model="form.status">
              <option v-for="status in STATUSES" :key="status" :value="status">
                {{ STATUS_LABELS[status] }}
              </option>
            </select>
          </label>

          <!-- ── Ampel-Status ── -->
          <div style="grid-column: 1 / -1;">
            <div class="form-section-label" style="margin-bottom: 0.5rem;">
              Erreichbarkeit der Firma
              <span class="form-section-hint">Kann diese Firma angeschrieben werden?</span>
            </div>
            <div class="ampel-btn-group">
              <button
                type="button"
                class="ampel-btn ampel-btn--green"
                :class="{ active: form.outreachStatus === 'green' }"
                @click="form.outreachStatus = 'green'; form.redReason = undefined"
              >● Grün — Anschreiben</button>
              <button
                type="button"
                class="ampel-btn ampel-btn--yellow"
                :class="{ active: form.outreachStatus === 'yellow' }"
                @click="form.outreachStatus = 'yellow'; form.redReason = undefined"
              >● Gelb — Keine Info</button>
              <button
                type="button"
                class="ampel-btn ampel-btn--red"
                :class="{ active: form.outreachStatus === 'red' }"
                @click="form.outreachStatus = 'red'"
              >● Rot — Nicht anschreiben</button>
            </div>
            <div v-if="form.outreachStatus === 'red'" class="ampel-red-reasons">
              <p class="ampel-red-reasons-label">Grund (Pflichtfeld)</p>
              <div
                v-for="(info, key) in RED_REASON_LABELS"
                :key="key"
                class="ampel-reason-option"
                @click="form.redReason = key"
              >
                <input type="radio" :value="key" v-model="form.redReason" @click.stop />
                <div class="ampel-reason-text">
                  <strong>{{ info.short }}</strong>
                  <span>{{ info.description }}</span>
                </div>
              </div>
            </div>
          </div>

          <label>
            Priorität
            <select v-model="form.priority">
              <option v-for="p in PRIORITIES" :key="p" :value="p">
                {{ PRIORITY_LABELS[p] }}
              </option>
            </select>
          </label>

          <label>
            Bewerbungsdeadline
            <input v-model="form.applicationDeadline" type="date" />
          </label>

          <!-- ── Nachweis ── -->
          <div class="form-section-label" style="grid-column: 1 / -1; margin-top: 0.5rem;">
            Nachweis
            <span class="form-section-hint">Zum Belegen der tatsächlich abgeschickten Bewerbung</span>
          </div>

          <label>
            Abgeschickt am
            <input v-model="form.proofSentAt" type="date" />
          </label>

          <label>
            Bestätigungslink
            <input v-model="form.proofUrl" type="url" placeholder="https://portal.firma.de/bestätigung…" />
          </label>

          <label style="grid-column: 1 / -1;">
            Bestätigungsnotiz
            <input v-model="form.proofNote" maxlength="200" placeholder="z. B. Bestätigung per E-Mail erhalten, Referenznr. 12345" />
          </label>

          <!-- ── Weitere Details (einklappbar) ── -->
          <div style="grid-column: 1 / -1;">
            <button
              type="button"
              class="details-toggle"
              @click="showDetails = !showDetails"
            >
              {{ showDetails ? '▲ Weitere Details ausblenden' : '▼ Weitere Details anzeigen' }}
            </button>
          </div>

          <template v-if="showDetails">
            <label>
              Stellenlink (URL)
              <input v-model="form.url" type="url" placeholder="https://…" />
            </label>

            <label>
              Kontakt
              <input v-model="form.contact" maxlength="120" placeholder="Name, E-Mail, LinkedIn, …" />
            </label>

            <label>
              Gehaltsspanne
              <input v-model="form.salaryRange" maxlength="120" placeholder="z. B. 50.000–60.000 €" />
            </label>

            <label>
              Quelle
              <input v-model="form.source" maxlength="120" placeholder="z. B. LinkedIn, Empfehlung, Karriereseite" />
            </label>

            <label>
              Bewerbungstyp
              <select v-model="form.applicationType">
                <option v-for="t in APPLICATION_TYPES" :key="t" :value="t">
                  {{ APPLICATION_TYPE_LABELS[t] }}
                </option>
              </select>
            </label>

            <label>
              Nächstes Follow-up
              <input v-model="form.nextFollowUpDate" type="date" />
            </label>

            <label style="grid-column: 1 / -1;">
              Vorstellungsgespräch (Datum / Uhrzeit)
              <input v-model="form.interviewAt" type="datetime-local" />
            </label>

            <label style="grid-column: 1 / -1;">
              Tags <span class="form-section-hint">(kommagetrennt, z. B. remote, startup)</span>
              <input v-model="tagInput" placeholder="remote, startup, empfehlung" />
            </label>

            <label>
              Letzte Aktion (Datum)
              <input v-model="form.lastActionAt" type="date" />
            </label>

            <label>
              Letzte Aktion (Notiz)
              <textarea v-model="form.lastActionNote" rows="2" />
            </label>

            <label style="grid-column: 1 / -1;">
              Notizen
              <textarea v-model="form.notes" rows="3" />
            </label>

            <fieldset class="docs-fieldset">
              <legend>Dokumente</legend>
              <div class="docs-checklist">
                <label class="doc-item">
                  <input type="checkbox" v-model="form.documents.cv" /> Lebenslauf
                </label>
                <label class="doc-item">
                  <input type="checkbox" v-model="form.documents.coverLetter" /> Anschreiben
                </label>
                <label class="doc-item">
                  <input type="checkbox" v-model="form.documents.motivationLetter" /> Motivationsschreiben
                </label>
                <label class="doc-item">
                  <input type="checkbox" v-model="form.documents.certificates" /> Zeugnisse
                </label>
                <label class="doc-item">
                  <input type="checkbox" v-model="form.documents.portfolio" /> Portfolio
                </label>
                <label class="doc-item">
                  <input type="checkbox" v-model="form.documents.github" /> GitHub
                </label>
              </div>
            </fieldset>
          </template>

          <!-- ── Footer ── -->
          <div class="actions" style="grid-column: 1 / -1;">
            <span class="required-hint">* Pflichtfelder</span>
            <div class="actions-right">
              <button type="button" class="ghost" @click="close">Abbrechen</button>
              <button type="submit" class="primary">
                {{ mode === "create" ? "Anlegen" : "Speichern" }}
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.form-section-label {
  grid-column: 1 / -1;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border);
  padding-bottom: 0.3rem;
  margin-top: 0.25rem;
}

.form-section-hint {
  font-weight: 400;
  text-transform: none;
  letter-spacing: 0;
  font-size: 0.75rem;
  margin-left: 0.5rem;
}

.required-star {
  color: #ef4444;
  margin-left: 2px;
}

.required-hint {
  font-size: 0.78rem;
  color: var(--text-muted);
}

.has-error input,
.has-error select,
.has-error textarea {
  border-color: #ef4444;
}

.field-error-msg {
  display: block;
  font-size: 0.76rem;
  color: #ef4444;
  margin-top: 0.15rem;
}

.details-toggle {
  background: none;
  border: 1px dashed var(--border);
  border-radius: 6px;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.82rem;
  padding: 0.4rem 0.9rem;
  width: 100%;
  text-align: left;
  transition: background 0.15s;
}

.details-toggle:hover {
  background: var(--surface-hover, rgba(0,0,0,0.04));
}

.docs-fieldset {
  grid-column: 1 / -1;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 0.75rem;
}

.docs-fieldset legend {
  font-weight: 600;
  color: var(--text);
  padding: 0 0.4rem;
  font-size: 0.88rem;
}

.actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.25rem;
}

.actions-right {
  display: flex;
  gap: 0.5rem;
}

.ampel-btn-group {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.ampel-btn {
  padding: 0.4rem 0.9rem;
  border-radius: 6px;
  font-size: 0.82rem;
  cursor: pointer;
  border: 2px solid transparent;
  background: var(--surface-muted);
  color: var(--text-muted);
  transition: background 0.12s, border-color 0.12s;
}

.ampel-btn--green.active  { border-color: #22c55e; background: #f0fdf4; color: #15803d; }
.ampel-btn--yellow.active { border-color: #eab308; background: #fefce8; color: #a16207; }
.ampel-btn--red.active    { border-color: #ef4444; background: #fef2f2; color: #b91c1c; }

.ampel-btn--green:not(.active):hover  { border-color: #86efac; }
.ampel-btn--yellow:not(.active):hover { border-color: #fde047; }
.ampel-btn--red:not(.active):hover    { border-color: #fca5a5; }

.ampel-red-reasons {
  margin-top: 0.6rem;
  padding: 0.75rem;
  background: color-mix(in srgb, #ef4444 8%, var(--surface));
  border: 1px solid color-mix(in srgb, #ef4444 30%, transparent);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.ampel-red-reasons-label {
  margin: 0 0 0.25rem;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--danger);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.ampel-reason-option {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.15rem 0;
}

.ampel-reason-option input[type="radio"] {
  margin-top: 0.2rem;
  flex-shrink: 0;
  width: auto;
  cursor: pointer;
}

.ampel-reason-text {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.ampel-reason-text strong {
  font-size: 0.85rem;
  color: var(--text);
}

.ampel-reason-text span {
  font-size: 0.78rem;
  color: var(--text-muted);
}
</style>
