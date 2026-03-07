# Company Application Tracker (Vue 3 + Vite + TypeScript)

A small single-page app for tracking company applications, interview progress, and follow-ups.

## Features

- Vue 3 + Vite + TypeScript
- CRUD for companies
- Search by company name, role, or location
- Filter by status, tag, and follow-up state (`All`, `Due`, `Overdue`, `None`)
- Sorting options: Updated desc (default), Follow-up date asc, Company name
- Detail and edit modals
- Extra fields: `salaryRange`, `source`, `lastActionAt`, `lastActionNote`
- Export current tracker data to JSON
- Import companies from JSON with best-effort validation and merge-by-id confirmation (imported records win on id conflicts)
- List and Kanban views (drag and drop cards between status columns)
- Overdue follow-ups highlighted in list and Kanban cards
- Local persistence via `localStorage`
- Light/Dark theme toggle in header
- Theme preference persisted in `localStorage` with system-theme default (`prefers-color-scheme`)

## Data Model

```ts
Company {
  id: string
  name: string
  role: string
  location: string
  url: string
  contact: string
  salaryRange: string
  source: string
  status: 'Interested' | 'Applied' | 'Interviewing' | 'Offer' | 'Rejected' | 'Archived'
  createdAt: string
  updatedAt: string
  notes: string
  tags: string[]
  nextFollowUpDate?: string
  lastActionAt?: string
  lastActionNote: string
}
```

## Import / Export

- `Export` downloads the current company list as a JSON file.
- `Import` accepts:
  - a JSON array of company objects, or
  - an object with a `companies` array.
- Imported records are validated/normalized best-effort.
- On import, the app shows a confirmation dialog with:
  - number of new records
  - number of id collisions to overwrite
- Merge rule: by `id`, imported entry replaces existing entry.

## Kanban

- Use the `List` / `Kanban` toggle in controls.
- Kanban columns map directly to `STATUSES`.
- Drag a card into a different column to update its status.

## Run

```bash
npm install
npm run dev
```

Then open the local Vite URL shown in the terminal (typically `http://localhost:5173`).

## Build

```bash
npm run build
npm run preview
```
