# Tasks

## 1. Softer look and High contrast

- [x] 1.1 In `styles/tokens.css`, soften the outline tokens per theme, add the `--strong-*` values and the `:root[data-contrast='high']` block; verify the dark-mode keycap contrast test in `tests/e2e/visual.spec.js` still passes
- [x] 1.2 In `styles/base.css`, drop the focus `border-radius` override, add the text-field focus offset and the drawn checkbox; verify checkboxes show their state in both themes (`tests/e2e/appearance.spec.js`)
- [x] 1.3 In `styles/board.css` and `styles/task.css`, make "Add task" borderless, quieten axis labels, align and tighten task rows, keep the row focus ring inside the row, and emphasise Do without a thicker border; verify the alignment, ring and no-shift tests in `tests/e2e/appearance.spec.js`
- [x] 1.4 Add the Appearance section with a High contrast checkbox to `index.html`, apply the stored or OS preference in the inline head script, and add `isHighContrast` / `setHighContrast` to `src/ui/settings.js`; verify the default, persistence and OS-preference tests in `tests/e2e/appearance.spec.js`
- [x] 1.5 Add a High contrast axe scan to `tests/e2e/a11y.spec.js` and update the section list in `tests/e2e/settings.spec.js`; verify both specs pass

## 2. Name and logo

- [x] 2.1 Replace the user-visible name with "First Things" in `index.html`, `manifest.webmanifest`, `src/ui/data-transfer.js`, `src/core/transfer.js` (export file name), `package.json`, `package-lock.json`, `README.md` and `openspec/config.yaml`, leaving storage keys and the cache name unchanged; verify `npm test` and the name assertions in `tests/e2e/header.spec.js`, `pwa.spec.js` and `transfer.spec.js` pass
- [x] 2.2 Redraw `icons/icon.svg` and `icons/icon-maskable.svg` as three outlined squares plus a filled top-right square and re-render the PNGs with `node scripts/render-icons.mjs`; verify the PNG sizes with `file icons/*.png`
- [x] 2.3 Add the logo mark next to the name in the header in `index.html` with `.app-logo` styles in `styles/board.css`; verify the header test in `tests/e2e/appearance.spec.js`
- [x] 2.4 Update the name in the unarchived delta specs of `add-hosting-and-pwa` and `refine-header-and-settings`; verify `openspec validate --strict` passes for all three changes

## 3. Move feedback and add form

- [x] 3.1 In `styles/task.css` and `styles/tokens.css`, redraw the drop insertion indicator as a zero-height bar with a dot, tint the target quadrant, and add the `task-moved` fade; verify the drag test in `tests/e2e/appearance.spec.js` (indicator placed between the right rows, rows do not shift)
- [x] 3.2 In `src/main.js` and `src/ui/dnd.js`, highlight a task's row after a keyboard move or a drop, but not when a reorder at the edge moves nothing; verify the keyboard-move test in `tests/e2e/appearance.spec.js`
- [x] 3.3 In `styles/board.css`, lay the add form out on one line at the same height and position as the "Add task" button, with the validation message wrapping below; verify the two add-form tests in `tests/e2e/appearance.spec.js` (desktop and 375px)

## 4. Integration

- [x] 4.1 Run `npm test` and `npm run test:e2e`; verify no failures in Chromium and WebKit locally
- [ ] 4.2 Verify the Test workflow passes in all three browsers on the pull request
