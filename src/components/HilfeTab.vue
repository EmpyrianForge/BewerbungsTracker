<script setup lang="ts">
defineEmits<{ 'reset-training-type': [] }>()
</script>

<template>
  <div class="hilfe-wrap">
    <h2 class="hilfe-title">Hilfe &amp; Erklärungen</h2>

    <!-- Status -->
    <section class="hilfe-section">
      <h3>Was bedeuten die Status?</h3>
      <div class="status-grid">
        <div class="status-item">
          <span class="status-dot" data-status="Interested"></span>
          <div>
            <strong>Interessiert</strong>
            <p>Du hast die Firma auf dem Schirm, aber noch keine Bewerbung abgeschickt. Guter erster Schritt, um Firmen zu sammeln.</p>
          </div>
        </div>
        <div class="status-item">
          <span class="status-dot" data-status="Applied"></span>
          <div>
            <strong>Beworben</strong>
            <p>Bewerbung wurde tatsächlich abgeschickt. Fülle hier den <em>Nachweis</em> aus (Datum + Bestätigungslink), damit der Fortschritt dokumentiert ist.</p>
          </div>
        </div>
        <div class="status-item">
          <span class="status-dot" data-status="Interviewing"></span>
          <div>
            <strong>Im Gespräch</strong>
            <p>Du wurdest zu einem Vorstellungsgespräch eingeladen. Trage das Datum unter „Vorstellungsgespräch" ein, damit du es nicht vergisst.</p>
          </div>
        </div>
        <div class="status-item">
          <span class="status-dot" data-status="Offer"></span>
          <div>
            <strong>Angebot erhalten</strong>
            <p>Die Firma hat dir eine Stelle angeboten. Herzlichen Glückwunsch! Notiere Details im Notizfeld.</p>
          </div>
        </div>
        <div class="status-item">
          <span class="status-dot" data-status="Rejected"></span>
          <div>
            <strong>Absage</strong>
            <p>Die Firma hat abgesagt (oder du hast abgesagt). Nicht entmutigen lassen – jede Absage ist Erfahrung.</p>
          </div>
        </div>
        <div class="status-item">
          <span class="status-dot" data-status="Archived"></span>
          <div>
            <strong>Archiviert</strong>
            <p>Firma ist nicht mehr relevant (z. B. keine offene Stelle). Wird im Tracker nicht mehr angezeigt, wenn du nach Status filterst.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Felder -->
    <section class="hilfe-section">
      <h3>Was bedeuten die Felder?</h3>
      <div class="field-table">
        <div class="field-row field-row--header">
          <span>Feld</span><span>Erklärung</span>
        </div>
        <div class="field-row">
          <span class="field-name">Firma <span class="req">*</span></span>
          <span>Name des Unternehmens. Pflichtfeld – ohne Firma kann kein Eintrag gespeichert werden.</span>
        </div>
        <div class="field-row">
          <span class="field-name">Stelle / Position <span class="req">*</span></span>
          <span>Die ausgeschriebene Stelle, auf die du dich bewirbst. Pflichtfeld.</span>
        </div>
        <div class="field-row">
          <span class="field-name">Ort</span>
          <span>Standort der Firma. Hilfreich beim Sortieren und Planen des Arbeitswegs.</span>
        </div>
        <div class="field-row">
          <span class="field-name">Priorität</span>
          <span><strong>Hoch</strong> = Wunscharbeitgeber, sofort bewerben. <strong>Mittel</strong> = gute Option. <strong>Niedrig</strong> = Backup.</span>
        </div>
        <div class="field-row">
          <span class="field-name">Bewerbungsdeadline</span>
          <span>Datum, bis zu dem die Bewerbung eingereicht sein muss. Einträge mit naher Deadline werden farblich hervorgehoben.</span>
        </div>
        <div class="field-row">
          <span class="field-name">Abgeschickt am</span>
          <span>Das Datum, an dem du die Bewerbung tatsächlich abgeschickt hast. Wird im WBS-Nachweis-Export verwendet.</span>
        </div>
        <div class="field-row">
          <span class="field-name">Bestätigungslink</span>
          <span>Link zur Bewerbungsbestätigung im Jobportal oder der Karriereseite der Firma. Als Nachweis einfügen.</span>
        </div>
        <div class="field-row">
          <span class="field-name">Bestätigungsnotiz</span>
          <span>Kurznotiz zum Nachweis, z. B. „Bestätigung per E-Mail erhalten, Ref.-Nr. 4711" oder „Screenshot gespeichert".</span>
        </div>
        <div class="field-row">
          <span class="field-name">Nächstes Follow-up</span>
          <span>Wann willst du nachfragen oder dich erneut melden? Überfällige Follow-ups werden rot markiert.</span>
        </div>
        <div class="field-row">
          <span class="field-name">Vorstellungsgespräch</span>
          <span>Datum und Uhrzeit des Gesprächstermins. Erscheint im Kalender-Tab.</span>
        </div>
        <div class="field-row">
          <span class="field-name">Tags</span>
          <span>Eigene Schlagworte, durch Komma getrennt. Können zum Filtern verwendet werden. Beispiele: <em>remote, vollzeit, initiativ</em>.</span>
        </div>
        <div class="field-row">
          <span class="field-name">Aktivitäten</span>
          <span>Tagebuch für alle Aktionen rund um diese Bewerbung: Telefonat, E-Mail, Recherche. Im Detailbereich einer Firma eintragen.</span>
        </div>
        <div class="field-row">
          <span class="field-name">Notizen</span>
          <span>Freies Textfeld für alle sonstigen Informationen zur Firma oder Stelle.</span>
        </div>
        <div class="field-row">
          <span class="field-name">Dokumente</span>
          <span>Checkliste der Unterlagen, die du zusammengestellt hast. Kein Upload – nur zur eigenen Kontrolle.</span>
        </div>
      </div>
    </section>

    <!-- Nachweis & OneDrive -->
    <section class="hilfe-section">
      <h3>Nachweis für die WBS — wie funktioniert das?</h3>

      <p class="hilfe-intro">
        Die WBS braucht regelmäßig einen Nachweis deiner Bewerbungsaktivität. Dafür gibt es den
        <strong>Nachweis-Export</strong> (PDF-Button oben oder „Teilen"-Funktion). Dieser enthält nur
        die Pflichtdaten – keine privaten Notizen, keine vollständigen Unterlagen.
      </p>

      <div class="workflow-steps">
        <div class="workflow-step">
          <span class="step-num">1</span>
          <div>
            <strong>Daten pflegen</strong>
            <p>Halte deinen Tracker aktuell: Status setzen, Datum eintragen, Nachweis-Feld ausfüllen sobald du eine Bewerbung abgeschickt hast.</p>
          </div>
        </div>
        <div class="workflow-step">
          <span class="step-num">2</span>
          <div>
            <strong>Nachweis exportieren</strong>
            <p>Klicke oben auf das <strong>⋯-Menü → PDF exportieren</strong>. Die Datei enthält nur die für den Nachweis relevanten Felder.</p>
          </div>
        </div>
        <div class="workflow-step">
          <span class="step-num">3</span>
          <div>
            <strong>Datei hochladen</strong>
            <p>Lade die Datei über den von der WBS bereitgestellten <strong>OneDrive-Upload-Link</strong> hoch. Du kannst dort nur hochladen – andere Teilnehmende sehen deine Daten nicht.</p>
          </div>
        </div>
        <div class="workflow-step">
          <span class="step-num">4</span>
          <div>
            <strong>Fertig</strong>
            <p>Die Standortleitung sieht deine Datei im zentralen Ordner und kann deinen Nachweis prüfen.</p>
          </div>
        </div>
      </div>

      <h4 class="hilfe-subhead">Was ist im Nachweis-Export enthalten?</h4>
      <div class="two-col">
        <div class="allowed-box">
          <div class="box-label box-label--ok">✓ Enthalten</div>
          <ul>
            <li>Dein Name / Teilnehmer-ID</li>
            <li>Firmenname</li>
            <li>Datum der Bewerbung</li>
            <li>Status der Bewerbung</li>
            <li>Letztes Update</li>
            <li>Nachweis vorhanden (ja/nein)</li>
          </ul>
        </div>
        <div class="allowed-box">
          <div class="box-label box-label--no">✗ Nicht enthalten</div>
          <ul>
            <li>Anschreiben / Lebenslauf</li>
            <li>Zeugnisse</li>
            <li>E-Mail-Inhalte</li>
            <li>Gesprächsnotizen</li>
            <li>Private Kontaktdaten</li>
            <li>Freitextfelder</li>
          </ul>
        </div>
      </div>

      <h4 class="hilfe-subhead">Warum „Dateien anfordern" statt freigegebener Ordner?</h4>
      <p class="hilfe-note">
        Der WBS-Upload nutzt die OneDrive-Funktion <em>„Dateien anfordern"</em>. Das bedeutet: Du kannst
        Dateien hochladen, aber den Inhalt des Ordners <strong>nicht sehen</strong>. Andere Teilnehmende
        sehen deine Uploads ebenfalls nicht. Nur die Standortleitung hat Zugriff auf den Ordnerinhalt.
        Das schützt die Daten aller Beteiligten.
      </p>

      <h4 class="hilfe-subhead">Alternative: Teilen-Link</h4>
      <p class="hilfe-note">
        Über <strong>⋯ → Ansicht teilen</strong> kannst du einen Link erzeugen, den du direkt per
        E-Mail an deine Standortleitung schickst. Der Link öffnet eine schreibgeschützte Ansicht deiner
        Einträge – ohne Anmeldung, ohne dass Daten auf fremden Servern gespeichert werden.
      </p>
    </section>

    <!-- Tipps -->
    <section class="hilfe-section">
      <h3>Tipps für den Alltag</h3>
      <ul class="tipps-list">
        <li><strong>Täglich kurz reinschauen:</strong> Gibt es überfällige Follow-ups? Das rote Glocken-Symbol oben rechts zeigt die Anzahl an.</li>
        <li><strong>Nachweis sofort ausfüllen:</strong> Wenn du eine Bewerbung abschickst, wechsle den Status auf „Beworben" und trage Datum und Bestätigungslink ein – am besten sofort, solange du noch im Browser bist.</li>
        <li><strong>Kanban-Ansicht:</strong> Im Kanban-Modus kannst du Karten per Drag &amp; Drop zwischen den Spalten verschieben, um den Status schnell zu ändern.</li>
        <li><strong>Daten bleiben lokal:</strong> Alle deine Einträge werden nur in deinem Browser gespeichert (localStorage). Es gibt keinen Server und keine Cloud-Synchronisation – nur du hast Zugriff.</li>
        <li><strong>Backup:</strong> Über <strong>⋯ → Daten exportieren</strong> kannst du jederzeit alle Einträge als JSON-Datei sichern und auf einem anderen Gerät wieder importieren.</li>
      </ul>
    </section>

    <!-- Beruf wechseln -->
    <section class="hilfe-section">
      <h3>Umschulungsberuf wechseln</h3>
      <p class="hilfe-note" style="margin-bottom: 0.9rem;">
        Beim ersten Start hast du einen Beruf ausgewählt, für den Beispieldaten geladen wurden (FIAE, FISI oder BÜMA).
        Falls du die Auswahl ändern möchtest, kannst du die Auswahl unten zurücksetzen.
        Deine bestehenden Einträge bleiben erhalten – es werden nur neue Beispieldaten des gewählten Berufs hinzugefügt.
      </p>
      <button
        type="button"
        class="reset-btn"
        @click="$emit('reset-training-type')"
      >
        Beruf-Auswahl zurücksetzen
      </button>
    </section>
  </div>
</template>

<style scoped>
.hilfe-wrap {
  max-width: 820px;
  margin: 0 auto;
  padding: 1rem 0 2rem;
}

.hilfe-title {
  font-size: 1.35rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
}

.hilfe-section {
  margin-bottom: 2rem;
}

.hilfe-section h3 {
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 0.85rem;
  padding-bottom: 0.35rem;
  border-bottom: 2px solid var(--border);
}

.hilfe-subhead {
  font-size: 0.9rem;
  font-weight: 700;
  margin: 1.25rem 0 0.5rem;
  color: var(--text);
}

.hilfe-intro {
  font-size: 0.88rem;
  color: var(--text-muted);
  margin-bottom: 1.1rem;
  line-height: 1.6;
}

.hilfe-note {
  font-size: 0.85rem;
  color: var(--text-muted);
  line-height: 1.6;
  margin: 0;
}

/* Status grid */
.status-grid {
  display: grid;
  gap: 0.7rem;
}

.status-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.status-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 3px;
}
.status-dot[data-status="Interested"]  { background: #3b82f6; }
.status-dot[data-status="Applied"]     { background: #8b5cf6; }
.status-dot[data-status="Interviewing"]{ background: #f59e0b; }
.status-dot[data-status="Offer"]       { background: #10b981; }
.status-dot[data-status="Rejected"]    { background: #ef4444; }
.status-dot[data-status="Archived"]    { background: #9ca3af; }

.status-item strong {
  display: block;
  font-size: 0.9rem;
  margin-bottom: 0.15rem;
}

.status-item p {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin: 0;
}

/* Field table */
.field-table {
  display: grid;
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  font-size: 0.85rem;
}

.field-row {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 0.75rem;
  padding: 0.55rem 0.85rem;
  border-bottom: 1px solid var(--border);
  align-items: start;
}

.field-row:last-child {
  border-bottom: none;
}

.field-row--header {
  background: var(--surface-alt, rgba(0,0,0,0.03));
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}

.field-name {
  font-weight: 600;
}

.req {
  color: #ef4444;
}

/* Workflow steps */
.workflow-steps {
  display: grid;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.workflow-step {
  display: flex;
  align-items: flex-start;
  gap: 0.9rem;
  padding: 0.75rem 1rem;
  background: var(--surface-muted, rgba(0,0,0,0.02));
  border: 1px solid var(--border);
  border-radius: 8px;
}

.step-num {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--accent, #3b82f6);
  color: #fff;
  font-size: 0.8rem;
  font-weight: 700;
  flex-shrink: 0;
  margin-top: 1px;
}

.workflow-step strong {
  display: block;
  font-size: 0.88rem;
  margin-bottom: 0.2rem;
}

.workflow-step p {
  font-size: 0.83rem;
  color: var(--text-muted);
  margin: 0;
  line-height: 1.5;
}

/* Two-column allowed/not-allowed */
.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-bottom: 0.25rem;
}

@media (max-width: 520px) {
  .two-col {
    grid-template-columns: 1fr;
  }
}

.allowed-box {
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  font-size: 0.83rem;
}

.box-label {
  padding: 0.4rem 0.75rem;
  font-weight: 700;
  font-size: 0.78rem;
}

.box-label--ok {
  background: #d1fae5;
  color: #065f46;
}

.box-label--no {
  background: #fee2e2;
  color: #991b1b;
}

[data-theme="dark"] .box-label--ok {
  background: rgba(16, 185, 129, 0.15);
  color: #6ee7b7;
}

[data-theme="dark"] .box-label--no {
  background: rgba(239, 68, 68, 0.15);
  color: #fca5a5;
}

.allowed-box ul {
  margin: 0;
  padding: 0.5rem 0.75rem 0.6rem 1.4rem;
  display: grid;
  gap: 0.25rem;
}

.allowed-box li {
  line-height: 1.4;
  color: var(--text-muted);
}

/* Reset training type */
.reset-btn {
  background: none;
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text-muted);
  font-size: 0.85rem;
  padding: 0.45rem 0.9rem;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}

.reset-btn:hover {
  border-color: #ef4444;
  color: #ef4444;
}

/* Tips */
.tipps-list {
  display: grid;
  gap: 0.6rem;
  padding-left: 1.2rem;
  font-size: 0.88rem;
}

.tipps-list li {
  line-height: 1.5;
}
</style>
