# Proposal

## Why

"Decision Matrix" reads as dry and describes the diagram, not what the app is for:
a task tool that helps you put first things first. Separately, the interface looked
harsher than intended: near-black focus rings (clipped on task rows), a dashed
"Add task" button, dark outlines on checkboxes and keycaps, a thick border on the
Do quadrant that nudged its content out of line, and task rows indented past their
heading.

## What Changes

- Rename the app to **First Things** everywhere a person sees the name: page title,
  header, install name, export file name (`first-things-YYYY-MM-DD.json`), messages
  and README. Storage keys, the service worker cache name and the URL keep their
  existing `decision-matrix` names so existing boards and installs carry over.
- New logo: a 2×2 grid with three outlined squares and the top-right one filled.
  Used for the app icons and shown next to the name in the header.
- Softer default look: mid-grey focus ring and control borders (still at least 3:1),
  lighter keycaps, a borderless "Add task" button, drawn checkboxes that use the same
  tokens as other controls, quieter axis labels, hover shown as a background rather
  than a border.
- Fixes: the focus ring on a task row is no longer clipped; text fields show one
  focus line instead of two; the Do quadrant is emphasised without shifting its
  content; task rows and the "Add task" label line up with the quadrant heading;
  rows are tighter.
- Moving a task is easier to follow: while dragging, a bar with a dot shows exactly
  where the task will land (without shifting the rows) and the target quadrant is
  tinted; after a move by drag or keyboard, the task's row is briefly highlighted.
- The add form is a single line (input, Add, Cancel) the same height and position as
  the "Add task" button it replaces, so opening it does not move anything.
- New **High contrast** setting (Settings → Appearance) that brings back the
  stronger outlines. It follows the OS "increase contrast" preference until the
  user chooses.

## Capabilities

### New Capabilities

None.

### Modified Capabilities
- `task-management`: adds a requirement that moving a task shows where it will land
  and where it landed.
- `theming`: adds a contrast preference (soft by default, High contrast on request
  or by OS preference) and a requirement that focus indicators are fully visible.

The app name also appears in requirements of two changes that are not archived yet
(`add-hosting-and-pwa`: install name and rejection messages; `refine-header-and-settings`:
header title). Those delta specs are updated in place to say "First Things".

## Impact

- **Styles**: `styles/tokens.css` (softer outline tokens, `--strong-*` values, the
  `data-contrast='high'` block), `styles/base.css` (focus ring, checkbox),
  `styles/board.css`, `styles/task.css`, `styles/dialog.css`.
- **App**: `index.html` (name, header logo, Appearance section, contrast applied
  before first paint), `src/ui/settings.js` (contrast setting),
  `src/ui/data-transfer.js` and `src/core/transfer.js` (name in messages and file name).
- **Assets and metadata**: `icons/*`, `manifest.webmanifest`, `package.json`,
  `package-lock.json`, `README.md`, `openspec/config.yaml`.
- **Tests**: new `tests/e2e/appearance.spec.js`; name and section updates in existing
  specs; a high-contrast accessibility scan in `tests/e2e/a11y.spec.js`.
- New localStorage key `decision-matrix:contrast` (`high` | `normal`). Task data is
  unchanged. No new dependencies.
