# Tasks

> Read `design.md` D16–D23 first (and the archived POC design for D1–D15). Use Node ≥ 20. Keep the monochrome palette: no new chromatic colors. Run `npm test` and the listed e2e spec after each group.

## 1. Layout direction (core + CSS)

- [x] 1.1 In `src/core/quadrants.js`, add the `layout` parameter to `horizontalNeighbour(id, direction, layout = 'urgent-right')` per design D17 and export `LAYOUTS = ['urgent-right', 'urgent-left']`; extend `tests/unit/quadrants.test.js` with all neighbour cases for both layouts; verify `npm test` passes
- [x] 1.2 Create `src/ui/settings.js` with `getLayout()` / `setLayout(value)` per design D18 (storage key `decision-matrix:layout`, try/catch, set/remove `data-layout` on `<html>`, announce the change); verify in the browser console that `setLayout('urgent-left')` sets the attribute and survives reload
- [x] 1.3 Extend the inline `<head>` script in `index.html` to apply `data-layout="urgent-left"` before paint (design D16)
- [x] 1.4 In `index.html` + `styles/board.css`, rename axis headers to `.axis-col-urgent` / `.axis-col-not-urgent` with grid areas `colU` / `colN`, and add the default and `:root[data-layout='urgent-left']` `grid-template-areas` per design D16 (base grid and ≥768px grid); mobile stays priority order
- [x] 1.5 In `src/ui/keyboard.js`, pass `getLayout()` to both `horizontalNeighbour` calls (focus ←/→ and `Ctrl/⌘ + ←/→` move)
- [x] 1.6 Add `tests/e2e/layout.spec.js`: default positions (Do's bounding box right of Plan's); after seeding `decision-matrix:layout=urgent-left` via `page.addInitScript`, Do is left of Plan on first paint, "Urgent" axis header is above the left column, `1` focuses Do, `→` from Do focuses Plan, `Ctrl+→` from Do moves the task to Plan, Tab order is still Do, Plan, Delegate, Eliminate; verify `npm run test:e2e -- layout` passes

## 2. Tokens and dark-mode legibility

- [x] 2.1 Add `--color-hover-raised`, `--color-divider`, `--color-kbd-bg`, `--color-kbd-border`, `--color-kbd-text` to `styles/tokens.css` for light and both dark selectors per design D23, plus `--font-size-app-title: 2rem`
- [x] 2.2 Switch `styles/kbd.css` to the kbd tokens and `styles/dialog.css` hovers to `--color-hover-raised` (dialog action buttons, toast Undo); verify visually in dark mode that button hover is visible in the edit dialog and keycaps are lighter than the dialog surface
- [x] 2.3 Extend `tests/e2e/visual.spec.js` monochrome check to still pass (new tokens are neutral) and add a check that in dark mode a keycap's computed border color differs from the dialog background; verify `npm run test:e2e -- visual` passes

## 3. Header and theme icon button

- [x] 3.1 Restyle the header per design D21 in `styles/board.css`: no border, no background, large bold `.app-title` (2rem, 1.6rem below 768px), `.icon-button` styles
- [x] 3.2 Replace `#theme-button` markup in `index.html` with an `.icon-button` containing inline Lucide `monitor`, `sun`, `moon` SVGs (design D21), wrapped in a `.tooltip-anchor` with an `aria-hidden` `.tooltip`
- [x] 3.3 Update `src/ui/theme.js`: `data-pref` on the button, `aria-label` "Theme: System|Light|Dark", tooltip text in sync, `announce()` on change; CSS shows the matching icon
- [x] 3.4 Create `styles/tooltip.css` (linked from `index.html`) and `src/ui/tooltip.js` per design D22 (hover + `:focus-visible` show, hover bridge, Escape dismiss with `stopPropagation`, reset on `mouseleave`/`focusout`, reduced motion); init it from `src/main.js`
- [x] 3.5 Update `tests/e2e/theme.spec.js` for the icon button (accessible name "Theme: System" etc., `data-pref`, visible icon changes) and add `tests/e2e/header.spec.js`: title is an `h1` "Decision Matrix" with font size > quadrant title font size, header `border-bottom-width` is 0, both icon buttons are ≥32×32, tooltip becomes visible on hover and on keyboard focus and hides on Escape while focus stays on the button; verify `npm run test:e2e -- theme header` passes

## 4. Settings dialog

- [x] 4.1 In `index.html`, replace `#help-button` with a gear `.icon-button` `#settings-button` (`aria-label="Settings"`, `aria-haspopup="dialog"`, tooltip "Settings" + keycaps) and replace `#help-dialog` with `#settings-dialog` structured per design D18 (title, × close button, Layout / Keyboard / Shortcuts sections, radio cards with mini diagrams, moved single-key checkbox, `#settings-shortcuts` container)
- [x] 4.2 Implement `initSettingsDialog()` in `src/ui/settings.js` (open, focus first control, restore previous focus on close, backdrop-click close, × close, radios bound to `getLayout`/`setLayout`); remove `initHelpDialog` from `src/ui/dialogs.js` and update `src/main.js`
- [x] 4.3 Style the dialog in `styles/dialog.css`: section headings, `--color-divider` separators, radio cards (selected card uses `--color-border-strong` 2px border + filled radio, hover `--color-hover-raised`), mini diagram boxes, × button; no horizontal scroll at 320px
- [x] 4.4 Add `tests/e2e/settings.spec.js`: settings button opens dialog with sections Layout, Keyboard, Shortcuts in order; choosing "Left" swaps the board immediately and persists after reload; single-key toggle still works and persists; Escape, × and backdrop click close it and return focus to the previously focused element; no horizontal overflow at 320px; verify `npm run test:e2e -- settings` passes

## 5. Keyboard: shortcuts reference and `⌘/Ctrl + ,`

- [x] 5.1 In `src/ui/keyboard.js`, add `group` to every `SHORTCUTS` entry (design D19), change the `?` entry to "Open Settings" wired to the settings dialog, and add the `settings-mod` entry per design D20 (works in text fields and with single-key shortcuts off)
- [x] 5.2 Rename `renderHelpContent` → `renderShortcutsReference` and render grouped rows (h4 per group, description left, keycaps right, stacked below 400px) into `#settings-shortcuts`; update `src/main.js`
- [x] 5.3 Update `aria-keyshortcuts` and tooltip keycaps on `#settings-button` to follow the single-key setting (D20); update `tests/e2e/keyboard.spec.js` and any other spec that referenced `#help-button`, `#help-dialog` or "Keyboard shortcuts"; add tests: `?` opens Settings, `Control+Comma`/`Meta+Comma` opens Settings from a focused task and from the add input, and still works with single-key shortcuts off; verify `npm run test:e2e -- keyboard settings` passes
- [ ] 5.4 Manual check on macOS in Chrome and Safari: does `⌘ + ,` open the app's Settings (not the browser's)? Record the result in the PR description; if a browser intercepts it, tell the user instead of changing the spec (design Risks)

## 6. Accessibility and docs

- [x] 6.1 Extend `tests/e2e/a11y.spec.js`: axe scans with layout `urgent-left`, with the Settings dialog open, and with a header tooltip visible, in both themes; fix any violations; verify `npm run test:e2e -- a11y` passes
- [ ] 6.2 Manual VoiceOver check (carried over from the archived POC task 9.4): quadrant regions announced with title + subtitle, checkbox labelled with task title, move/delete announcements heard, Settings button announced as "Settings", theme button announced with its current preference, and tooltips not read twice; record results in the PR description
- [x] 6.3 Update `README.md`: header/settings description, layout direction option, `?` / `⌘,` shortcuts in the shortcut list, and a Lucide (ISC) icon credit; verify the documented shortcuts match `SHORTCUTS`

## 7. Final integration check

- [x] 7.1 Run `npm test` and `npm run test:e2e` (Chromium + WebKit; Firefox where it can launch) and verify everything passes; visually check header, tooltips and Settings in light and dark at desktop and 375px — unit 79/79; e2e Chromium + WebKit 116 passed, 2 skipped (known WebKit Tab-order quirk); Firefox still fails to launch on this machine ("Could not find profile folder"); visually checked light/dark desktop and 375px
- [x] 7.2 Run `openspec validate refine-header-and-settings --strict` and verify it reports no errors
- [ ] 7.3 When archiving this change, update the Purpose line in `openspec/specs/matrix-board/spec.md` (it still says the most important quadrant is in the top-right) to mention the configurable layout
