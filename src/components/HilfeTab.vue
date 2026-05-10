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
          <span>Das Datum, an dem du die Bewerbung tatsächlich abgeschickt hast. Dient als Nachweis.</span>
        </div>
        <div class="field-row">
          <span class="field-name">Bestätigungslink</span>
          <span>Link zur Bewerbungsbestätigung im Jobportal (z. B. dein Profil auf Stepstone, Indeed, der Karriereseite der Firma). Als Nachweis einfügen.</span>
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

    <!-- Tipps -->
    <section class="hilfe-section">
      <h3>Tipps für den Alltag</h3>
      <ul class="tipps-list">
        <li><strong>Täglich kurz reinschauen:</strong> Schau morgens kurz in den Tracker – gibt es überfällige Follow-ups? (rotes Glocken-Symbol oben rechts)</li>
        <li><strong>Nachweis sofort ausfüllen:</strong> Wenn du eine Bewerbung abschickst, wechsle sofort den Status auf „Beworben" und trage das Datum ein.</li>
        <li><strong>PDF für die Standortleitung:</strong> Mit dem „PDF"-Button oben kannst du jederzeit eine druckfertige Übersicht aller Bewerbungen erstellen.</li>
        <li><strong>Teilen-Link:</strong> Mit „Teilen" erzeugst du einen Link, den du per E-Mail an deine Standortleitung schicken kannst – ohne Anmeldung, keine Daten auf fremden Servern.</li>
        <li><strong>Kanban-Ansicht:</strong> Im Kanban-Modus kannst du Karten per Drag &amp; Drop zwischen den Spalten verschieben, um den Status schnell zu ändern.</li>
      </ul>
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
.status-dot[data-status="Interested"] { background: #3b82f6; }
.status-dot[data-status="Applied"]    { background: #8b5cf6; }
.status-dot[data-status="Interviewing"] { background: #f59e0b; }
.status-dot[data-status="Offer"]      { background: #10b981; }
.status-dot[data-status="Rejected"]   { background: #ef4444; }
.status-dot[data-status="Archived"]   { background: #9ca3af; }

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
