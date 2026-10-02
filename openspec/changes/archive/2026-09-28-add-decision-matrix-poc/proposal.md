# Proposal

## Why

Most TODO apps are flat lists, and flat lists hide the difference between work that is *urgent* and work that is *important*. Randy Pausch's time-management lecture recommends sorting tasks on a 2×2 importance/urgency matrix and working the "important" row first. We want a fast, minimalist, keyboard-first POC of that idea ("Linear for TODOs, seen through priority") that runs entirely in the browser and can be hosted on GitHub Pages, so we can validate the interaction model before adding sync or other features.

## What Changes

- New static web app (no build step, no runtime dependencies) served from the repo root.
- A board of four quadrants laid out like a chart: **important quadrants on top, urgent quadrants on the right**, with "Urgent / Not urgent" column headers and "Important / Not important" row headers. Each quadrant is titled with an action and a plain-language subtitle:
  - Top-right: "Do" — Urgent and important
  - Top-left: "Plan" — Important but not urgent
  - Bottom-right: "Delegate" — Urgent but not important
  - Bottom-left: "Eliminate" — Not urgent and not important
- Tasks with a title (required), optional notes, and an optional due date (display only). Tasks can be created, edited, completed/uncompleted (struck through in place for the rest of the day, then automatically archived into a collapsible per-quadrant "Completed (n)" list), deleted (with undo), reordered within a quadrant, and moved between quadrants.
- Full keyboard operation in a Linear-style model (quadrant jump keys, arrow navigation, single-key actions, shortcut help overlay, shortcuts shown as keycaps inside buttons), plus mouse drag & drop.
- Local persistence through a storage adapter interface; the POC ships a `localStorage` adapter only. The data is versioned so later adapters (e.g. GitHub Gist sync) can be added as a separate change.
- A monochrome, neutral visual style with prominent quadrant headings; color is used only for validation and error states.
- Light and dark themes that follow the OS by default, with a persisted manual override (System / Light / Dark).
- WCAG 2.2 AA accessibility target.
- Dev-only test tooling: `node:test` unit tests for core logic, Playwright e2e tests including an axe accessibility scan.

## Non-goals (POC)

- Cross-device sync, accounts, or a backend (planned as a follow-up change behind the storage adapter).
- Multiple boards/projects, tags, search, command palette, recurring tasks, reminders or notifications.
- Automatically moving tasks between quadrants as their due date approaches.
- Mobile-first touch gestures (the layout must be usable on small screens, but drag & drop on touch is not required).
- JSON import/export.

## Capabilities

### New Capabilities
- `matrix-board`: The four-quadrant board — layout, axis headers, quadrant identity/metadata and headings, per-quadrant task lists, empty states, and responsive behaviour.
- `task-management`: The task model and all operations on tasks — create, edit (title, notes, due date), complete/uncomplete, delete with undo, reorder within a quadrant, move between quadrants (keyboard and drag & drop).
- `keyboard-navigation`: Keyboard-first interaction and accessibility — focus model, shortcuts, shortcut help overlay, screen-reader announcements, and focus visibility.
- `data-persistence`: Storage adapter contract, the localStorage adapter, the versioned data format, load/save behaviour, and handling of corrupt or unavailable storage.
- `theming`: Light/dark themes, System/Light/Dark preference and its persistence, the monochrome palette (color only for errors), and contrast requirements.

### Modified Capabilities
- None (greenfield project).

## Impact

- New files at the repo root: `index.html`, `src/` (core + ui ES modules), `styles/`, `tests/`, `package.json` (devDependencies only), `README.md`, and a GitHub Pages deploy workflow.
- No runtime dependencies; dev dependencies: `@playwright/test`, `@axe-core/playwright`, and a tiny static file server for e2e tests.
- Data lives in the user's browser only (per origin). Clearing site data deletes tasks; this is an accepted limitation of the POC.
