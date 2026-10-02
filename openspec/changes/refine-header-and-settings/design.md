# Design

## Context

Builds on the POC (archived as `openspec/changes/archive/2026-09-28-add-decision-matrix-poc/`; its design D1–D15 still applies). Relevant current state:

- Header: `index.html` `.app-header` with a bottom border and surface background (`styles/board.css`), a text button `#theme-button` ("Theme: System", `src/ui/theme.js`) and `#help-button` ("Keyboard shortcuts" + `?` keycap).
- Help dialog: `#help-dialog`, opened by `initHelpDialog()` in `src/ui/dialogs.js`; its table is built by `renderHelpContent()` in `src/ui/keyboard.js` from the `SHORTCUTS` table; the single-key toggle `#single-key-shortcuts-toggle` lives in it; the inline head script already applies `data-single-keys="off"` before paint.
- Board grid: `grid-template-areas` in `styles/board.css` (`'. colL colR' / 'rowT plan do' / 'rowB drop limit'`); axis headers `.axis-col-left` ("Not urgent") and `.axis-col-right` ("Urgent").
- Spatial neighbours: static `LEFT_NEIGHBOUR` / `RIGHT_NEIGHBOUR` maps in `src/core/quadrants.js`, used twice in `keyboard.js`.
- Dark-mode dialog problems come from tokens: dialog background `--color-surface-raised` = gray-10 and `--color-hover` = gray-10 (hover invisible), dividers `--color-border` = gray-9 (barely visible), keycaps use `--color-bg` = gray-12 (darker than the dialog).

## Goals / Non-Goals

**Goals:**
- Layout direction as a pure CSS concern driven by one `<html>` attribute, with a single JS function that knows neighbours.
- Reuse the existing keyboard/`SHORTCUTS` infrastructure for the Settings dialog; no second shortcut list.
- Fix dark-mode legibility via tokens, not per-component overrides.

**Non-Goals:**
- A generic settings framework or settings stored in the task data document.
- Icon library/runtime dependency.

## Decisions

### D16. Layout direction attribute

- Storage key `decision-matrix:layout`, values `urgent-right` (default) | `urgent-left`. Any other/missing value = `urgent-right`.
- The inline `<head>` script (which already handles theme and single-keys) sets `document.documentElement.dataset.layout = 'urgent-left'` when stored; absent attribute = default. This gives "no jump on load" for free.
- CSS only (in `styles/board.css`):
  - Rename axis header classes to semantic ones: `.axis-col-urgent` (grid-area `colU`, text "Urgent") and `.axis-col-not-urgent` (grid-area `colN`, text "Not urgent").
  - Default ≥768px: `'. colN colU' 'rowT plan do' 'rowB drop limit'`.
  - `:root[data-layout='urgent-left']`: `'. colU colN' 'rowT do plan' 'rowB limit drop'`.
  - Default base grid (without axis headers, e.g. before the media query) swaps the same way. Mobile single-column layout is unchanged (priority order).
- DOM order is untouched (priority order), so Tab order and screen-reader order do not change. *Alternative considered*: reordering DOM nodes in JS — rejected, it would change Tab order and add a render dependency.

### D17. Neighbour lookup takes the layout

`horizontalNeighbour(id, direction, layout = 'urgent-right')` in `src/core/quadrants.js`: for `urgent-left`, swap `direction` before looking it up in the existing maps (the urgent-left grid is an exact horizontal mirror). `keyboard.js` passes `getLayout()` from `src/ui/settings.js`. Unit-tested in `tests/unit/quadrants.test.js`.

### D18. Settings module and dialog

- New `src/ui/settings.js`:
  - `getLayout()`, `setLayout(value)` (persist in try/catch, set/remove `data-layout`, announce "Layout: urgent column on the left").
  - `initSettingsDialog({ openButton, keyboard })` replaces `initHelpDialog`: `showModal()`, remembers `document.activeElement` to restore focus on close, closes on backdrop click (`click` whose `target === dialog`), wires the layout radios and the existing single-key checkbox (logic for the toggle stays in `keyboard.js`; only its DOM location moves).
- `index.html`: `#help-dialog` → `#settings-dialog` titled "Settings" (`h2`), with three `<section>`s each titled by an `h3`:
  1. **Layout** — `<fieldset>` with `<legend>Urgent column</legend>` and two radio "cards" (`<label>` wrapping `<input type=radio name=layout value=urgent-right|urgent-left>`, text "Right" / "Left", a hint line "Do top-right (default)" / "Do top-left (classic Eisenhower)", and an `aria-hidden` 2×2 mini diagram made of four small boxes labelled 1–4, the `1` box filled with `--color-text`).
  2. **Keyboard** — the existing single-key checkbox with a one-line explanation.
  3. **Shortcuts** — container `#settings-shortcuts` rendered by `renderShortcutsReference()` (renamed from `renderHelpContent`).
- Close button: an icon-only "×" button in the dialog's top-right (`aria-label="Close settings"`), in addition to Escape and backdrop click. The old bottom "Close" button is removed.

### D19. Shortcuts reference layout

Add `group: 'navigate' | 'tasks' | 'app'` to every `SHORTCUTS` entry. Render one block per group with an `h4` ("Navigate", "Tasks", "App") and a `<dl>`-style two-column CSS grid per row: description on the left (wraps), keycaps right-aligned (no wrap). Groups are separated by a `--color-divider` line; rows have no borders (less noise than the current table). At <400px the keys drop under the description. The `?` entry description becomes "Open Settings"; add the new `settings-mod` entry (see D20).

### D20. `⌘/Ctrl + ,` shortcut

New `SHORTCUTS` entry `id: 'settings-mod'`, matched by `event.code === 'Comma'` with `metaKey` (Apple) or `ctrlKey` (others), `preventDefault()`. It is a modifier shortcut, so it runs even when focus is in a text field and when single-key shortcuts are off (the text-field guard is skipped for it, like Escape handling). `aria-keyshortcuts` on the Settings button: `"? Meta+Comma"` / `"? Control+Comma"`, and just the modifier form when single-key shortcuts are off.

### D21. Header and icon buttons

- `.app-header`: remove `border-bottom` and `background`; padding `var(--space-5) var(--space-4) var(--space-2)`. `.app-title`: new token `--font-size-app-title: 2rem` (≥ quadrant title 1.5rem), `font-weight: 750`, `letter-spacing: -0.02em`, `line-height: 1.1`, margin 0. At <768px: 1.6rem.
- `.icon-button`: 36×36px, no border, transparent background, `border-radius: var(--radius-md)`, `color: var(--color-text-muted)`, hover/`:focus-visible` → `background: var(--color-hover)` and `color: var(--color-text)`; icon 20×20.
- Icons: inline SVG in `index.html` (static markup, no user data), `fill="none" stroke="currentColor" stroke-width="2"`, `aria-hidden="true" focusable="false"`. Use the Lucide `monitor`, `sun`, `moon`, `settings` and `x` icon paths (ISC license; add a credit line in `README.md`). The theme button contains all three theme icons; CSS shows one based on `data-pref` on the button (`[data-pref='system'] .icon-monitor` etc.), so no DOM rebuild on click.
- `src/ui/theme.js`: set `button.dataset.pref`, `aria-label` = "Theme: System" (drop the "Activate to change." suffix; tooltip text equals the name), update the tooltip text, and `announce()` the new preference.

### D22. Tooltips

- New `styles/tooltip.css` and `src/ui/tooltip.js`. Markup: `<span class="tooltip-anchor">` wrapping the button and a `<span class="tooltip" aria-hidden="true">` (text + optional keycaps). `aria-hidden` because the button's `aria-label` already carries the same text; the tooltip is a visual aid only (avoids double announcements).
- Show via CSS: `.tooltip-anchor:hover .tooltip, .tooltip-anchor:has(:focus-visible) .tooltip { opacity: 1; visibility: visible }` unless the anchor has `data-dismissed`. Positioned below the button, right-aligned to it (header controls are at the right edge, so it never overflows); a transparent `::before` bridge between button and tooltip keeps it hoverable (WCAG 1.4.13). 150ms delay on hover-in; no transition under `prefers-reduced-motion`.
- `tooltip.js`: on Escape while a tooltip is visible, set `data-dismissed` and `stopPropagation()` so the global Escape handler doesn't also fire; clear `data-dismissed` on `mouseleave`/`focusout`.
- Tooltip styling: inverse colors (`--color-inverse-bg` / `--color-inverse-text`), `--font-size-meta`, radius-sm, padding `4px 8px`; keycaps inside use the same inverse treatment as the primary-button keycaps.

### D23. Token fixes for dialogs in dark mode

Add semantic tokens in `styles/tokens.css` (light / dark):

| Token | Light | Dark | Used for |
|-------|-------|------|----------|
| `--color-hover-raised` | gray-2 | gray-9 | hover on anything inside dialogs/toasts |
| `--color-divider` | gray-3 | gray-8 | group separators in Settings, dialog section separators |
| `--color-kbd-bg` | gray-0 | gray-9 | keycap background (everywhere) |
| `--color-kbd-border` | gray-6 | gray-6 | keycap border (≥3:1 on white and on gray-10) |
| `--color-kbd-text` | gray-9 | gray-2 | keycap text in dialogs and tooltips-off contexts |

`styles/kbd.css` switches to these tokens; `styles/dialog.css` uses `--color-hover-raised` for `.dialog-actions button:hover`, radio cards, and the close button. Board keycaps keep their current look in light mode apart from the token swap.

## Risks / Trade-offs

- [`⌘ + ,` may be intercepted by the browser on macOS (Chrome/Safari use it for their own settings)] → The page calls `preventDefault()`; verify manually in Chrome and Safari (task 5.4). If a browser still opens its own settings, keep `?` and the button as the primary ways in and report back — do not silently remove the shortcut from the spec.
- [Tooltip hidden with `aria-hidden` means screen readers won't hear the shortcut from the tooltip] → The shortcut is exposed via `aria-keyshortcuts` and listed in Settings.
- [`:has()` support] → Supported in all target browsers (last two versions); without it, tooltips still show on hover.
- [Renaming `#help-dialog`/`#help-button` breaks existing e2e selectors] → Update tests in the same task groups that rename them.

## Migration Plan

No data migration: the new `decision-matrix:layout` key defaults to the current layout when absent, so existing users see no change until they open Settings.

## Open Questions

None.
