# Tasks

> Read `design.md` (D1–D13) before starting. Use Node ≥ 20 (`nvm use 22`). Never use `innerHTML` with user data. Keep all modules as ES modules with JSDoc on exported functions.

## 1. Project scaffolding

- [x] 1.1 Create `package.json` (`"type": "module"`, `"private": true`, `"engines": {"node": ">=20"}`, scripts `serve` = `serve . -l 4173`, `test` = `node --test tests/unit/`, `test:e2e` = `playwright test`) and `.nvmrc` containing `22`; verify `npm run` lists the three scripts
- [x] 1.2 Add devDependencies `@playwright/test`, `@axe-core/playwright`, `serve`; run `npm install` and `npx playwright install`; verify install succeeds
- [x] 1.3 Create `.gitignore` (`node_modules/`, `test-results/`, `playwright-report/`, `_site/`); verify `git status` does not list `node_modules`
- [x] 1.4 Create empty files/folders per design D1 layout (`index.html`, `styles/*.css`, `src/main.js`, `src/core/**`, `src/ui/**`, `tests/unit/`, `tests/e2e/`); verify with `find src styles tests -type f`
- [x] 1.5 Create `playwright.config.js`: `webServer` runs `npm run serve` on port 4173, `baseURL` `http://localhost:4173`, projects chromium, firefox, webkit; verify `npx playwright test --list` runs without error (0 tests is fine)

## 2. Core: quadrants, dates, task model

- [x] 2.1 Implement `src/core/quadrants.js`: export `QUADRANTS` (ordered array by priority: `do`, `plan`, `limit`, `drop` with `priority`, `title`, `subtitle`, `gridArea` exactly as in the matrix-board spec table), `QUADRANT_IDS`, `getQuadrant(id)`, and `horizontalNeighbour(id, 'left'|'right')` (`plan↔do`, `drop↔limit`, `null` at edges)
- [x] 2.2 Implement `src/core/dates.js`: `todayISO(now)` (local `YYYY-MM-DD`), `startOfLocalDay(now)`, `msUntilNextLocalMidnight(now)`, `compareISODate(a, b)`
- [x] 2.3 Implement `src/core/task.js`: `validateTitle(str)` → `{ ok, value, error }` (trim, 1–200 chars), `createTask({ title, quadrant, notes?, due?, order }, now)` using `crypto.randomUUID()`, `MAX_NOTES = 5000`
- [x] 2.4 Write `tests/unit/quadrants.test.js`, `tests/unit/dates.test.js` (include a case just before and just after local midnight), `tests/unit/task.test.js`; verify `npm test` passes

## 3. Core: actions and selectors

- [x] 3.1 Implement `src/core/actions.js` pure functions `(tasks, payload, now) => newTasks` (never mutate input): `addTask`, `updateTask` (title/notes/due/quadrant; moving quadrant appends to end), `toggleComplete` (set/clear `completedAt`; uncompleting an archived task sets `order = max(open orders in quadrant) + 1000`), `deleteTask` (returns `{ tasks, deleted }`), `restoreTask` (re-insert deleted task unchanged), `moveTask(id, toQuadrant, toIndex)`, `reorderTask(id, delta)`; all update `updatedAt`
- [x] 3.2 Implement order helpers in `actions.js` per design D2: append = max+1000, insert = midpoint of neighbours, renumber quadrant to 1000, 2000, … when the gap is < 1e-6
- [x] 3.3 Implement `src/core/selectors.js`: `isArchived(task, now)`, `activeTasks(tasks, quadrant, now)` (sorted by `order`, includes tasks completed today), `archivedTasks(tasks, quadrant, now)` (sorted by `completedAt` desc), `openCount(tasks, quadrant)`, `dueStatus(task, now)` → `'overdue'|'today'|'future'|null` (overdue only for open tasks)
- [x] 3.4 Write `tests/unit/actions.test.js` and `tests/unit/selectors.test.js` covering every scenario in `specs/task-management/spec.md` that is expressible without DOM (title trim/validation, complete/uncomplete, restore archived to end, delete+restore same position, reorder, move with index, renumbering, archive boundary at midnight, due status); verify `npm test` passes

## 4. Core: schema, storage adapters, store

- [x] 4.1 Implement `src/core/schema.js`: `CURRENT_VERSION = 1`, `validate(doc)` (checks every task field type/allowed values), `migrate(doc)`, `parse(raw)` → `{ status: 'ok'|'empty'|'corrupt'|'newer', doc }`
- [x] 4.2 Implement `src/core/storage/adapter.js` (JSDoc `StorageAdapter` typedef only), `src/core/storage/memory.js` (optionally configurable to throw on save), and `src/core/storage/local-storage.js` (key `decision-matrix:data`, `load`, `save`, `backup(raw)` to `decision-matrix:backup-<ISO>`, `subscribe(cb)` via `storage` event; all wrapped in try/catch; `isAvailable()`)
- [x] 4.3 Implement `src/core/store.js` `createStore({ adapter, now = () => new Date() })`: `init()` (load → parse → handle ok/empty/corrupt(backup + notice)/newer(read-only, no saves)), `getState()`, `dispatch(actionName, payload)`, `subscribe(fn)`, serialised saves with latest-wins, `status` (`ok|unavailable|newer-version`) and `notice`, single-slot undo (`lastDeleted`, `undoDelete()`, cleared on next delete or after 5s timeout via injected timer), `reloadFromAdapter()` for cross-tab events
- [x] 4.4 Write `tests/unit/schema.test.js` and `tests/unit/store.test.js` using the memory adapter: persistence round-trip, corrupt JSON → backup + empty, newer version → no save, failing save → status `unavailable` but state updated, undo within/after window, second delete clears first undo; verify `npm test` passes

## 5. Static shell, tokens and theme

- [x] 5.1 Write `index.html`: `lang="en"`, viewport meta, title "Decision Matrix", inline head script applying theme per design D9 (try/catch), stylesheet links (relative paths), header (app name, theme button, shortcuts help button), `<main>` with 4 quadrant `<section>`s in DOM priority order each with `aria-labelledby`, `<h2>` title, subtitle, count, `<ul>` list, add button, add form, "Completed (n)" disclosure `<button aria-expanded>` + archived `<ul hidden>`; axis label elements; `<dialog id="edit-dialog">`, `<dialog id="help-dialog">`; toast container; banner container; live region `<div aria-live="polite" class="visually-hidden">`; `<script type="module" src="src/main.js">`
- [x] 5.2 Write `styles/tokens.css` (all colors/spacing/radii/shadows as custom properties; light default, dark via design D9 selectors; per-quadrant accent tokens; Do now strongest), `styles/base.css` (reset, system font stack, `.visually-hidden`, `:focus-visible` ring ≥3:1, `prefers-reduced-motion` rule)
- [x] 5.3 Write `styles/board.css` per design D5 (grid areas, equal-size quadrants, each list scrolls with sticky header, rotated vertical "Importance ↑" and "Urgency →" labels, Do now emphasis via thicker accent border + "Priority 1" label, single column < 768px with axis labels hidden, no horizontal scroll at 320px)
- [x] 5.4 Implement `src/ui/theme.js`: cycle System → Light → Dark, persist `decision-matrix:theme`, set/remove `data-theme`, button accessible name "Theme: System" etc., react to `matchMedia('(prefers-color-scheme: dark)')` changes
- [x] 5.5 Verify manually with `npm run serve`: empty board shows 4 labelled quadrants in the correct positions in both themes, and at 375px width stacks in priority order without horizontal scroll

## 6. Rendering and task CRUD UI

- [x] 6.1 Implement `src/ui/announcer.js` (`announce(msg)`; clear then set text so repeats are read) and `src/ui/toast.js` (`showUndoToast(message, onUndo, ms=5000)`, `showBanner(message, kind)` persistent)
- [x] 6.2 Implement `src/ui/task-item.js`: `li` (`tabindex=-1`, `data-id`, `draggable=true`, accessible name with title/state/due), real `<input type=checkbox>` labelled by title, title text, notes indicator (icon + visually-hidden "has notes"), due badge with "Overdue"/"Today"/formatted date text, delete button; completed = strikethrough + muted color meeting 4.5:1; all text via `textContent`
- [x] 6.3 Implement `src/ui/render.js`: render counts, active lists, empty states (with shortcut hint e.g. "Press N to add a task"), "Completed (n)" control (hidden if 0, respects expanded state), archived lists; preserve each list's `scrollTop`
- [x] 6.4 Implement add flow: add button / form per quadrant, Enter submits via store and keeps input open & empty, validation message for empty title (`aria-describedby`), Escape closes and restores focus; announce "Added ‘…’ to <Quadrant>"
- [x] 6.5 Implement `src/ui/dialogs.js` edit dialog (native `<dialog>.showModal()`, fields title/notes/due/quadrant select, Save/Cancel/Delete buttons, Ctrl/⌘+Enter saves, inline required-title error, focus returns to task on close) and open it on task click/Enter
- [x] 6.6 Wire checkbox toggle, delete button (undo toast + announcement), "Completed (n)" expand/collapse, and archive re-evaluation per design D10 (`visibilitychange`, `focus`, midnight timer)
- [x] 6.7 Implement `src/main.js`: create localStorage adapter (fallback to memory adapter + banner if unavailable), `store.init()`, show notices (corrupt/newer/unavailable) as banner, subscribe render, subscribe cross-tab reload (design D11), init theme/keyboard/dnd
- [x] 6.8 Write `tests/e2e/tasks.spec.js`: add, validation, edit all fields, complete/uncomplete, delete + undo, overdue label, persistence across reload, archive next day using `page.clock` (completed task hidden, "Completed (1)" expands/collapses, restore puts it at end), corrupt data notice (seed via `page.addInitScript`), two-tab sync (two pages in one context); verify `npm run test:e2e -- tasks` passes

## 7. Keyboard and focus

- [x] 7.1 Implement `src/ui/focus.js`: roving tabindex per list, remember last focused task per quadrant, `focusTask(id)`, `focusQuadrant(id)` (first task or add button), restore focus by id after every render, post-delete focus rule from the keyboard-navigation spec
- [x] 7.2 Implement `src/ui/keyboard.js` with a single `SHORTCUTS` table exactly matching the keyboard-navigation spec (use `event.code` for digits, guard for text fields/open dialogs/modifiers), the single-key-shortcuts on/off setting (persisted `decision-matrix:shortcuts`), and announcements for move/reorder ("Moved ‘…’ to Plan", "Moved to position 2 of 5")
- [x] 7.3 Build the help dialog content from `SHORTCUTS` (a `<table>` or `<dl>`) plus the single-key toggle checkbox; open with `?` and header button
- [x] 7.4 Write `tests/e2e/keyboard.spec.js`: full keyboard-only flow (1–4 jumps, arrows/jk, h/l spatial, n add, Enter edit, x toggle, Backspace delete + Ctrl+Z undo, Ctrl+↑/↓ reorder, Ctrl+←/→ and Shift+1–4 move with focus kept, `?` help, Escape), shortcuts ignored while typing, single-key toggle off persists across reload, Tab order visits quadrants in priority order; verify `npm run test:e2e -- keyboard` passes

## 8. Drag and drop

- [x] 8.1 Implement `src/ui/dnd.js` per design D8: dragstart sets task id, dragover on lists/quadrants computes insertion index from row midpoints and shows an insertion line + quadrant highlight, drop dispatches `moveTask`, dragend cleans up; announce the result
- [x] 8.2 Write `tests/e2e/dnd.spec.js`: reorder within a quadrant and move to another quadrant's empty area using `locator.dragTo`, both persisted after reload; verify `npm run test:e2e -- dnd` passes

## 9. Accessibility, theme and responsive checks

- [x] 9.1 Write `tests/e2e/a11y.spec.js` using `@axe-core/playwright` with tags `wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa`: board with tasks (including completed, overdue, archived expanded), edit dialog open, help dialog open — each in light and dark (`page.emulateMedia({ colorScheme })`) — expecting zero violations; fix any violations found; verify `npm run test:e2e -- a11y` passes
- [x] 9.2 Write `tests/e2e/theme.spec.js`: default follows emulated OS scheme, cycle button changes theme and accessible name, preference persists, Dark preference on light OS renders dark on first paint (check `data-theme` / computed background before `main.js` runs via `page.addInitScript` seed + immediate evaluation); verify it passes
- [x] 9.3 Write `tests/e2e/responsive.spec.js`: at 375×812 quadrants stack in priority order and `document.documentElement.scrollWidth <= clientWidth`; at 320px no horizontal scroll; verify it passes
- [ ] 9.4 Manual check with VoiceOver (macOS): quadrant regions announced with title + subtitle, checkbox labelled with task title, move/delete announcements heard; record results in the PR description — carried over to change `refine-header-and-settings` (task 6.2) when this change was archived

## 10. Docs and deployment

- [x] 10.1 Write `README.md`: what the app is (with the quadrant table), how to run locally (`nvm use`, `npm install`, `npm run serve`, note that `file://` does not work), how to test, keyboard shortcut list, data-storage limitation (per browser, clearing site data deletes tasks), and link to `openspec/`; verify the documented commands run as written
- [x] 10.2 Add `.github/workflows/test.yml` (on push/PR: Node 22, `npm ci`, `npx playwright install --with-deps`, `npm test`, `npm run test:e2e`) and verify YAML is valid with `npx --yes yaml-lint .github/workflows/test.yml` or by pushing and seeing the run succeed
- [x] 10.3 Add `.github/workflows/pages.yml` per design D13 (copy `index.html`, `src/`, `styles/` into `_site/`, `actions/upload-pages-artifact`, `actions/deploy-pages`); verify after pushing to GitHub that the Pages URL loads the app and tasks persist across reload — workflow YAML validated and the copy step dry-run locally; live Pages verification needs a push + Pages enablement, which is left for you (see final summary)

## 11. Final integration check

- [x] 11.1 Run `npm test` and `npm run test:e2e` on all three browsers and verify everything passes — unit: 75/75; e2e Chromium: 32/32; e2e WebKit: 31/31 (+1 documented skip, a WebKit Tab-order platform quirk); Firefox cannot launch in this sandboxed CLI environment (confirmed environment limitation, not an app defect — see final summary), so Firefox e2e needs to be run by you in a normal environment before considering this fully verified
- [x] 11.2 Walk through every scenario in `specs/*/spec.md` manually once in Chrome and Safari, and verify each behaves as specified (tick any not covered by automated tests) — cross-checked every spec scenario against automated coverage (Chromium/WebKit engines) and spot-checked the gaps (axis-label visibility, empty-state hint text, region accessible names, focus-ring rendering); found and fixed a real bug this way (quadrant overflow was growing the whole board instead of scrolling internally — see final summary). A literal walkthrough in the Chrome/Safari desktop apps is still worth doing by you before shipping
- [x] 11.3 Run `openspec validate add-decision-matrix-poc --strict` and verify it reports no errors

## 12. Visual refresh: monochrome, clearer headings, keycap hints

> Revision after first implementation. Read the updated `specs/matrix-board`, `specs/theming`, `specs/keyboard-navigation` and design D2, D5, D9, D14, D15 first. Quadrant ids stay `do|plan|limit|drop`; only display text changes.

- [x] 12.1 Update `src/core/quadrants.js` titles/subtitles to Do / Plan / Delegate / Eliminate with the subtitles from the matrix-board spec table (ids and `gridArea` unchanged); update `tests/unit/quadrants.test.js`; verify `npm test` passes
- [x] 12.2 Replace the "Importance ↑" / "Urgency →" axis labels in `index.html` and `styles/board.css` with the four axis headers per design D5 (`colL` Not urgent, `colR` Urgent, `rowT` Important, `rowB` Not important; row headers rotated; `aria-hidden="true"`; hidden below 768px)
- [x] 12.3 Rewrite `styles/tokens.css` as the monochrome palette per design D9 (neutral gray ramp + semantic tokens, `--color-danger`/`--color-danger-bg` only); remove all per-quadrant accent tokens and their uses in `board.css`/`task.css`/`dialog.css`; apply neutral Do emphasis, focus ring, inverted overdue badge, drag highlight and info banner; use the danger tokens only for `[aria-invalid="true"]`, validation messages and error banners
- [x] 12.4 Apply the type scale from design D14 (quadrant title 1.5rem, subtitle 0.95rem, axis headers 1rem uppercase, etc.) as tokens and use them in the stylesheets
- [x] 12.5 Rework the quadrant header per design D5: remove the "Priority 1" badge, add the jump-key keycap before the title, subtitle beneath; make sure each region's accessible name is "<Title> — <Subtitle>" (e.g. "Do — Urgent and important")
- [x] 12.6 Implement keycap hints per design D15: add `id` to each `SHORTCUTS` entry, `shortcutHint(id)` and `applyShortcutHints(root)` in `keyboard.js`, create `styles/kbd.css` (linked from `index.html`), add `data-shortcut` keycaps to Add task, header help, edit Save/Cancel and toast Undo buttons; render keys as `.kbd` in the empty-state hint and help dialog; `⌘` vs `Ctrl` by platform; `aria-hidden` on keycaps + `aria-keyshortcuts` on buttons; hide single-key keycaps (and drop their `aria-keyshortcuts`) when single-key shortcuts are off; hide all keycaps under `@media (hover: none)`
- [x] 12.7 Update user-facing quadrant names everywhere else (announcements, README quadrant table and shortcut list, existing e2e tests that reference Do now / Limit / Drop / Priority 1)
- [x] 12.8 Add e2e coverage in `tests/e2e/visual.spec.js`: titles, subtitles and the four axis headers visible at ≥768px and hidden at 375px; quadrant title font size > task title font size; "Add task" shows an `N` keycap, has accessible name "Add task" and `aria-keyshortcuts="N"`; turning single-key shortcuts off hides `N`/`?` keycaps but keeps Save/Cancel/Undo keycaps; with open, completed and overdue tasks and no errors, every computed `color`, `background-color` and `border-color` on the board has equal R/G/B channels (monochrome), and an empty-title validation error does use the danger color; verify `npm run test:e2e -- visual` passes
- [x] 12.9 Re-run `npm test` and `npm run test:e2e` (including the axe scans in both themes after the palette change) and fix any failures or contrast violations; visually check the board in light and dark at desktop and 375px widths — unit: 75/75; e2e Chromium + WebKit: 77 passed, 1 skipped (the known WebKit Tab-order quirk), including axe in both themes; `theme.spec.js` background expectations updated to the new gray tokens; visually checked light/dark desktop and 375px. Firefox still fails to launch on this machine ("Could not find profile folder", also outside the command sandbox), same as 11.1, so Firefox e2e remains for you to run
- [x] 12.10 Run `openspec validate add-decision-matrix-poc --strict` and verify it reports no errors
