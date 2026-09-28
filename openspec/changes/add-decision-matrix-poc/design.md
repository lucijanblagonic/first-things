# Design

## Context

Greenfield repo (only OpenSpec scaffolding exists). Constraints from the project context: vanilla ES modules, no build step, no runtime dependencies, deployable from the repo root to GitHub Pages, testable with `node:test` (core) and Playwright (UI). Implementation will be done by a less capable model, so this document fixes every structural decision up front. Requirements live in `specs/`; this file only explains *how*.

## Goals / Non-Goals

**Goals:**
- A small, legible architecture: one state store, pure action functions, one render pass per change.
- Core logic 100% DOM-free and unit-testable in Node.
- Storage behind an async adapter so a Gist/cloud adapter can drop in later.

**Non-Goals:**
- Virtual DOM, incremental/keyed DOM diffing, or performance work beyond "hundreds of tasks feel instant".
- Supporting browsers older than the last two versions of Chrome, Firefox, Safari, Edge.

## Decisions

### D1. File layout

```
index.html                  # markup shell, inline theme bootstrap script, <script type="module" src="src/main.js">
styles/
  tokens.css                # design tokens (:root light, [data-theme=dark], prefers-color-scheme)
  base.css                  # reset, typography, focus ring, utilities (.visually-hidden)
  board.css                 # grid, quadrants, axis labels, responsive
  task.css                  # task row, checkbox, due badge, drag states
  dialog.css                # <dialog> styles, toast, banner
src/
  main.js                   # bootstrap: create adapter, load, create store, mount UI
  core/
    quadrants.js            # QUADRANTS constant (id, priority, title, subtitle, gridArea) + neighbours map
    task.js                 # createTask(), validateTitle(), normalise helpers
    actions.js              # pure reducers: (state, payload, now) => newState
    selectors.js            # activeTasks(), archivedTasks(), openCount(), isArchived(), dueStatus()
    store.js                # createStore(adapter): getState, dispatch, subscribe; persistence + undo slot
    schema.js               # CURRENT_VERSION, migrate(), validate()
    storage/
      adapter.js            # JSDoc typedef StorageAdapter { load(): Promise<string|null>, save(str): Promise<void>, subscribe?(cb) }
      local-storage.js      # localStorage implementation (+ 'storage' event subscribe)
      memory.js             # in-memory implementation for tests
    dates.js                # todayISO(now), startOfLocalDay(now), msUntilNextLocalMidnight(now)
  ui/
    render.js               # render(state, uiState) → updates DOM for the whole board
    task-item.js            # builds one task <li>
    keyboard.js             # global keydown handler + shortcut table (single source for help dialog)
    focus.js                # roving tabindex, remember last-focused per quadrant, focus restore
    dnd.js                  # native HTML5 drag & drop
    dialogs.js              # edit dialog, help dialog
    toast.js                # undo toast + persistent banner
    announcer.js            # aria-live polite region
    theme.js                # theme cycle control, matchMedia listener
tests/
  unit/*.test.js            # node:test
  e2e/*.spec.js             # Playwright
package.json                # "type": "module", devDependencies + scripts only
playwright.config.js
.github/workflows/pages.yml # deploy static root to GitHub Pages
.github/workflows/test.yml  # run unit + e2e on push/PR
README.md
```

### D2. State shape and data format

Persisted document (key `decision-matrix:data`):

```json
{ "version": 1, "tasks": [ {
  "id": "uuid", "title": "string", "notes": "string", "due": "YYYY-MM-DD" | null,
  "quadrant": "do" | "plan" | "limit" | "drop", "order": 1000,
  "createdAt": "ISO", "updatedAt": "ISO", "completedAt": "ISO" | null
} ] }
```

- `id` from `crypto.randomUUID()`.
- `order` is a number; list order = sort by `order` ascending. Insert at end = `max + 1000`; insert between = midpoint; if a midpoint gap falls below `1e-6`, renumber that quadrant (1000, 2000, …). Chosen over array index because it keeps moves a single-task update, which matters for a future sync adapter (fewer conflicts).
- **Archived is derived, never stored:** `isArchived(task, now) = completedAt !== null && completedAt < startOfLocalDay(now)`. No background job and no data migration are needed; changing the rule later is free.
- Restoring an archived task (uncomplete) also sets `order = max + 1000` so it lands at the end of the open tasks (per spec).
- Theme preference stored separately under `decision-matrix:theme` (`"system" | "light" | "dark"`), because it must be read by the inline pre-paint script.
- Corrupt data backup key: `decision-matrix:backup-<ISO timestamp>`.

In-memory (not persisted) UI state: focused task id, last-focused task per quadrant, open add-input quadrant, expanded "Completed" quadrants, open dialog, undo slot `{ task, expiresAt }`, storage status (`ok | unavailable | newer-version`).

### D3. Store and actions

`actions.js` exports pure functions `(tasks, payload, now) => tasks`: `addTask`, `updateTask`, `toggleComplete`, `deleteTask`, `restoreTask`, `moveTask(id, toQuadrant, toIndex)`, `reorderTask(id, delta)`. `now` is injected so unit tests control time (archiving, timestamps).

`store.js` holds state, runs an action, notifies subscribers synchronously (UI re-renders), then calls `adapter.save(JSON.stringify(doc))`. Saves are serialised (a save never starts while one is in flight; the latest pending state wins). If save rejects, status becomes `unavailable` and the banner shows. If status is `newer-version`, saves are skipped entirely.

Alternative considered: event-sourced log for undo/sync. Rejected as overkill; single-slot undo only needs the deleted task and its original `order`/quadrant.

### D4. Rendering

Full re-render of the four quadrant lists on each state change using `document.createElement` / `textContent` (never `innerHTML` with user data — prevents XSS from task titles/notes). Static structure (header, quadrant sections, axis labels, dialogs, live region) lives in `index.html`; `render.js` only replaces `<ul>` contents, counts, the "Completed (n)" control and empty states. After each render, `focus.js` restores focus to the focused task id (or the D-fallback from the spec). Hundreds of tasks re-render in well under a frame, so diffing is unnecessary.

### D5. Quadrant geometry and DOM order

DOM order is priority order (do, plan, limit, drop) so Tab and screen-reader order follow priority. Visual 2×2 placement uses CSS `grid-template-areas`:

```
"axisY plan do"
"axisY drop limit"
".     axisX axisX"
```

Spatial neighbours for ←/→ come from a static map in `quadrants.js` (`plan ↔ do`, `drop ↔ limit`; ←/→ at an edge does nothing). ↑/↓ always moves between tasks, never between quadrants (keeps the model simple). Under 768px, the grid becomes a single column in DOM order and axis labels are hidden (subtitles carry the meaning).

### D6. Keyboard

One `keydown` listener on `document`. A single `SHORTCUTS` array (`{ keys, description, when, run }`) drives both handling and the help dialog, so they cannot drift. Guard: skip single-key shortcuts when `event.target` is an `input`, `textarea`, `select` or `[contenteditable]`, or when a dialog is open (dialogs handle their own Escape/Ctrl+Enter). Digits use `event.code` (`Digit1`…`Digit4`) so `Shift+1` works on every layout. Each task list uses roving `tabindex` (focused/remembered task = `0`, others = `-1`); list `role` stays native `ul/li`, each `li` is focusable with an accessible name composed of title, state and due date.

### D7. Dialogs

Native `<dialog>` with `showModal()` — gives focus trapping, Escape handling, and `::backdrop` for free in all target browsers. Edit dialog fields: title (`input`, required, maxlength 200), notes (`textarea`, maxlength 5000), due (`input type=date`), quadrant (`select`). Ctrl/⌘+Enter submits. On close, focus returns to the task's `li`.

### D8. Drag & drop

Native HTML5 DnD (`draggable="true"` on `li`, `dragover`/`drop` on each quadrant `ul`). The insertion index is computed from pointer Y vs. the midpoints of sibling rows; an insertion line element shows where the task will land. Chosen over pointer-event custom DnD because it is less code and Playwright's `dragTo` supports it. Touch drag is out of scope (keyboard/edit dialog cover moving on mobile).

### D9. Theming

`tokens.css` defines all colors as custom properties. Selector strategy:

```css
:root { /* light tokens */ }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { /* dark tokens */ } }
:root[data-theme="dark"] { /* dark tokens */ }
```

An inline `<script>` in `<head>` (before stylesheets) reads `decision-matrix:theme` in a try/catch and sets `data-theme` only for `light`/`dark`; `system` leaves it unset so the media query applies (no flash). Quadrant accents: Do now = strongest accent (e.g. red/orange family) with a thicker top border and "Priority 1" label; Plan = blue; Limit = amber; Drop = neutral grey. Exact values are picked during implementation and checked with the axe scan plus manual contrast checks against the theming spec.

### D10. Archiving re-evaluation

Because archiving is derived from `now`, the UI just re-renders with a fresh `now` on `visibilitychange` (visible), `focus`, and a `setTimeout` for `msUntilNextLocalMidnight(now) + 1000` that re-arms itself.

### D11. Cross-tab sync

`local-storage.js` exposes `subscribe(cb)` using the `storage` event (fires only in *other* tabs). On event, the store reloads and re-renders without saving. Last write wins between near-simultaneous edits; acceptable for a single-user POC.

### D12. Testing

- `npm test` → `node --test tests/unit/` covering: task validation, every action (including order midpoint/renumbering), selectors (archiving boundary at local midnight, due status), schema validate/migrate/newer-version, store persistence with the memory adapter and a failing adapter.
- `npm run test:e2e` → Playwright (Chromium + WebKit + Firefox) against a static server (`npx http-server` style dev dependency, e.g. `serve`), with tests for: create/edit/complete/delete+undo, reload persistence, keyboard-only full flow, drag & drop move and reorder, archive (via `page.clock` set to next day), theme toggle + no-flash, corrupt data notice, mobile viewport layout, and an axe scan (`@axe-core/playwright`, tags `wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa`) in both color schemes.
- Node ≥ 20 is required for the tooling; `package.json` sets `"engines": { "node": ">=20" }` and an `.nvmrc` with `22`.

### D13. Deployment

`.github/workflows/pages.yml` uses `actions/upload-pages-artifact` with the repo root (excluding `tests`, `openspec`, `node_modules` via a small copy step into `_site/`). All asset URLs in `index.html` are relative so the app works under `/<repo-name>/`. Opening `index.html` via `file://` is NOT supported (ES modules require HTTP); README documents `npx serve .` for local use.

## Risks / Trade-offs

- [localStorage is per browser/origin; clearing site data loses tasks] → Documented in README; storage adapter keeps a sync follow-up cheap.
- [Full re-render could lose focus or scroll position] → `focus.js` restores focus by task id after each render; each list's `scrollTop` is saved and restored.
- [Native HTML5 DnD has quirks (Safari drag image, no touch)] → Keyboard and edit-dialog moving are always available; DnD is an enhancement.
- [Single-key shortcuts can conflict with screen-reader/voice-control keys] → A persisted "single-key shortcuts" toggle in the help dialog (key `decision-matrix:shortcuts`, default on) satisfies WCAG 2.1.4; every action is also reachable with buttons, and shortcuts never fire while typing.
- [Fractional `order` values drift] → Renumber a quadrant when gaps get too small (D2).
- [Timezone/midnight edge cases for archiving] → All "day" logic lives in `dates.js` with unit tests around midnight and DST.

## Migration Plan

Greenfield: no migration. Deploy by pushing to `main`; GitHub Pages workflow publishes. Rollback = revert commit. Data format starts at `version: 1` with a `migrate()` hook ready for future versions.

## Open Questions

- Exact accent color values (resolved during implementation within the contrast rules of the theming spec).
- Repository name / Pages URL (only affects README links).
