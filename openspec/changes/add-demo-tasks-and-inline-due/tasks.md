# Tasks

## 1. Due date beside the title

- [x] 1.1 In `src/ui/task-item.js`, wrap the title and the due badge in a `.task-headline` row, keep the notes preview below it, and remove the meta row; in `styles/task.css`, add `.task-headline` (wrapping, baseline-aligned) and make the badge non-shrinking; verify the same-line test in `tests/e2e/demo.spec.js` and the overdue test in `tests/e2e/tasks.spec.js`

## 1b. Do as a raised card

- [x] 1b.1 In `styles/tokens.css`, add `--color-surface-flat`, `--color-border-flat`, `--color-surface-do`, `--shadow-raised` and `--color-hover-row` for both themes; in `styles/board.css`, make Do the raised card and the other quadrants flat, with High contrast keeping outlines; in `styles/task.css`, stop rows painting their own background and use the translucent hover; verify the raised-card test in `tests/e2e/appearance.spec.js` in both themes and that the axe scans in `tests/e2e/a11y.spec.js` still pass

- [x] 1b.2 Keep all four quadrants on the same surface, enlarge Do's shadow (`--shadow-raised`), and turn the drop-target tint into a translucent wash; verify the raised-card test in `tests/e2e/appearance.spec.js` in both themes
- [x] 1b.5 In `styles/dialog.css`, use `--color-border` for the toast and its Undo button; verify the toast test in `tests/e2e/appearance.spec.js`
- [x] 1b.3 Remove the per-quadrant count from `index.html`, `src/ui/render.js` and `styles/board.css`, and its assertions from `tests/e2e/tasks.spec.js`; verify the no-count test in `tests/e2e/appearance.spec.js`
- [x] 1b.4 Remove the empty-quadrant hint from `index.html`, `src/ui/render.js`, `styles/board.css` and `styles/kbd.css`; verify the empty-quadrant test in `tests/e2e/appearance.spec.js`

## 2. Example tasks

- [x] 2.1 Create `src/core/demo.js` exporting `createDemoTasks(now)` (three tasks: Do due yesterday, Plan due in seven days, Eliminate undated, each with notes) and add it to `PRECACHE_URLS` in `sw.js`; verify `tests/unit/demo.test.js` and the precache test pass with `npm test`
- [x] 2.2 In `src/core/store.js`, accept an optional `seedTasks` and use it in `init()` only when nothing is stored, saving the result; pass `createDemoTasks` from `src/main.js`; verify the two `seedTasks` tests in `tests/unit/store.test.js`
- [x] 2.3 In `playwright.config.js`, start every spec from a saved empty board via `use.storageState`; add `tests/e2e/demo.spec.js` with an empty storage state covering the first visit, persistence across reload, and deletion; verify `npm run test:e2e` passes with the existing specs unchanged
- [x] 2.4 In `README.md`, mention the example tasks on a first visit; update the first-visit scenarios in `openspec/changes/add-hosting-and-pwa/specs/installable-app/spec.md`; verify `openspec validate --strict` passes for both changes

## 3. Integration

- [x] 3.1 Run `npm test` and `npm run test:e2e`; verify no failures in Chromium and WebKit locally
- [ ] 3.2 Verify the Test workflow passes in all three browsers on the pull request
