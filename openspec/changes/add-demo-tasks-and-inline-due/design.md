# Design

## Context

`src/ui/task-item.js` builds each row: checkbox, a main column (title, notes preview,
then a meta row holding the due badge), delete button. `src/core/store.js` `init()`
loads through the storage adapter; `parse()` reports `empty` when nothing is stored.
Most e2e specs assume an empty board on first load.

## Goals / Non-Goals

**Goals:** due date readable at a glance; a first visit that explains itself.
**Non-Goals:** a guided tour, a "restore examples" action, changing the due badge
styles.

## Decisions

### D1. Headline row
Title and due badge go in a wrapping flex row (`.task-headline`, baseline-aligned).
The badge has `flex: none` and `white-space: nowrap`, so with a long title it wraps to
the next line instead of shrinking. The meta row is removed; it held only the badge.

### D2. Seeding belongs to the store, the content to its own module
`createStore` takes an optional `seedTasks(now)`. In `init()`, only when `parse()`
reports `empty`, it uses the seed and schedules a save. Saving immediately is what
makes it once-only: afterwards storage holds a document, even if the user deletes
everything. `reloadFromAdapter()` (other-tab changes) never seeds. `src/main.js`
passes `createDemoTasks` from `src/core/demo.js`; unit tests of the store pass
nothing and are unaffected. *Alternative:* a separate "seeded" flag in storage — an
extra key to keep in step with the data for the same result.

### D3. Example content
Three tasks built with `createTask`: Do (due yesterday, so it shows as overdue), Plan
(due in a week), Eliminate (no date). Dates are computed from the local day of the
first visit. Each has one line of notes that explains a feature; the last says the
tasks are examples and can be deleted.

### D4. E2E specs start from a saved empty board
`playwright.config.js` sets `use.storageState` with `decision-matrix:data` holding an
empty document for the test origin, so existing specs keep their empty starting
point. `tests/e2e/demo.spec.js` overrides it with an empty storage state to cover a
real first visit. *Alternative:* clearing in every spec — an init script would also
run on reload and wipe state mid-test.

### D5. Do as a raised card
Tokens per theme: `--color-surface-flat` / `--color-border-flat` for the three flat
quadrants, `--color-surface-do` and `--shadow-raised` for Do. In the light theme Do is
white with a two-layer shadow over cards one step dimmer. Shadows barely register on
a dark page, so in the dark theme Do is also a step lighter than the others. Border
width is the same on all four, so nothing shifts. Task rows no longer paint their own
background, and row hover is a translucent wash (`--color-hover-row`) so it shows on
either surface. High contrast keeps outlines on every card and adds an inset line to
Do on top of the shadow. *Alternatives shown to the user:* a thicker border darker
or lighter than the focus ring, a filled "1" badge, and combinations; the raised card
was chosen because it uses no outline and so cannot be confused with focus.

## Risks / Trade-offs

- [Someone may not want example tasks] → three deletions, and they never return.
- [The example dates age: the "future" one becomes overdue after a week] → they are
  ordinary tasks; that is what an untouched task would do.
- [Storage unavailable (private mode): examples appear on every visit] → consistent
  with nothing being saved in that mode.
