# Proposal

## Why

A first-time visitor lands on four empty quadrants with nothing to show what the app
does. And a task's due date sits on its own line under the title, so an overdue task
does not stand out where the eye reads first.

## What Changes

- Show a task's due date (including the "Overdue" and "Today" labels) on the same
  line as its title, directly after it. The notes preview stays on the line below.
- On a first visit — when nothing has ever been saved in this browser — start the
  board with three example tasks in different quadrants: one overdue, one with a
  future date, one without a date, each with a line of notes that explains a
  feature. They are ordinary tasks and are seeded only once: after they are deleted,
  or after any board has been saved, they do not come back.

- Quadrant surfaces step down with priority. Do is the one raised card: a bright
  surface with a shadow. Plan and Delegate are see-through outlines on the page.
  Eliminate is dimmed. No outline is used for emphasis, so it cannot be mistaken for
  focus.
- Remove the task count from each quadrant header.
- Remove the "No tasks yet" hint from empty quadrants; an empty quadrant shows its
  heading and the "Add task" button.

## Capabilities

### New Capabilities

None.

### Modified Capabilities
- `task-management`: adds requirements for where the due date is shown and for the
  example tasks on a first visit.
- `matrix-board`: the quadrant header no longer shows a count and an empty quadrant
  no longer shows a hint.

The "most important quadrant is emphasised" scenario lives in the unarchived
`refine-header-and-settings` delta for `matrix-board`; its wording is updated in place
from "heavier border" to "raised card".

The unarchived `add-hosting-and-pwa` delta spec says a first visit shows empty
quadrants; those scenarios are updated in place to mention the example tasks.

## Impact

- `src/ui/task-item.js`, `styles/task.css` (headline row with title and due date; the
  separate meta row is removed).
- New `src/core/demo.js`; `src/core/store.js` (optional `seedTasks`), `src/main.js`,
  `sw.js` (precache list).
- `styles/tokens.css`, `styles/board.css`, `styles/task.css` (raised Do card,
  see-through Plan and Delegate, dimmed Eliminate, row hover and drop target as a
  translucent wash).
- `index.html`, `src/ui/render.js`, `styles/board.css`, `styles/kbd.css` (count and
  empty hint removed).
- Tests: new `tests/e2e/demo.spec.js`, `tests/unit/demo.test.js`; store tests;
  `playwright.config.js` now starts every other spec from an already-saved empty
  board so they are not affected by the examples.
- `README.md`. No data format change, no new dependencies.
