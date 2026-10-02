# Proposal

## Why

After using the POC, the header feels heavy (bordered bar, two bordered text buttons) while the app title is weak. The "Keyboard shortcuts" dialog already holds a setting and needs room for more, and people who learned the classic Eisenhower matrix expect "Do" in the top-left, not the top-right. In dark mode the shortcuts dialog is hard to read (keycaps darker than the dialog, near-invisible row dividers, no hover feedback).

## What Changes

- **Header**: remove the header's bottom border and bordered bar look; make "Decision Matrix" a large, bold page title (no tagline). Header controls become quiet icon buttons.
- **Theme control**: replace the "Theme: System" text button with a single icon button (monitor / sun / moon for System / Light / Dark) that still cycles System → Light → Dark, with a tooltip on hover *and* keyboard focus.
- **Settings dialog** (renamed from "Keyboard shortcuts"): opened by a gear icon button with a tooltip, `?`, or new `⌘/Ctrl + ,`. It contains three sections:
  1. **Layout**: quadrant direction — "Urgent column on the right" (default, current layout, Do top-right) or "Urgent column on the left" (classic Eisenhower, Do top-left). Only the columns swap; the Important row always stays on top.
  2. **Keyboard**: the single-key shortcuts toggle (moved here).
  3. **Shortcuts reference**: the shortcuts table, restyled to read well in both themes.
- Layout direction is persisted and applied before first paint (no layout jump), and ←/→ navigation and `Ctrl/⌘ + ←/→` moves follow the *visual* layout.
- Dark-mode fixes for dialogs: distinct hover color, visible dividers, keycaps that stand out from the dialog surface.
- Carry over the outstanding manual VoiceOver check from the archived POC change.

## Non-goals

- A tagline/quote in the header.
- Flipping the Important/Not important rows.
- Any new data fields, sync, or changes to task behaviour.

## Capabilities

### New Capabilities
- `settings`: The Settings dialog — how it opens/closes, its sections, the quadrant layout direction preference and its persistence, and legibility in both themes.

### Modified Capabilities
- `matrix-board`: quadrant positions and axis headers become dependent on the layout direction setting; new app-header requirement (prominent title, no border, icon controls).
- `keyboard-navigation`: `?` opens Settings, new `⌘/Ctrl + ,` shortcut, ←/→ follow the visual layout; the shortcut-help requirement is replaced by the Settings dialog; the single-key toggle lives in Settings; the header button with the `?` hint is now "Settings".
- `theming`: the theme control becomes an icon button with a tooltip.

## Impact

- `index.html` (header, help dialog → settings dialog, inline pre-paint script), `styles/board.css`, `styles/dialog.css`, `styles/kbd.css`, `styles/tokens.css`, new `styles/tooltip.css`.
- `src/ui/theme.js`, `src/ui/keyboard.js`, `src/ui/dialogs.js` (help → settings), new `src/ui/settings.js` and `src/ui/icons.js`, `src/core/quadrants.js` (neighbour lookup takes the layout).
- New localStorage key `decision-matrix:layout`. Task data format is unchanged.
- Updates to existing unit/e2e tests that reference "Keyboard shortcuts", "Theme: …" button text, or assume Do is always top-right.
