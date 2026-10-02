# Proposal

## Why

On a phone the dialogs are clumsy: they float as small centred boxes, the keyboard
opens the moment a task is tapped and covers half of the form, Save and Cancel can
end up under it, Settings loses its close button once scrolled, and the page behind
scrolls along. The stacked board also had no space under the last quadrant, because
the board was squeezed into the screen height and its content overflowed it. On a
keyboard, Tab from the add form's Cancel button left the form instead of returning
to the input.

## What Changes

- **Small screens: dialogs are full-screen sheets.** The edit dialog and Settings fill
  the visible screen, sized to the area above the on-screen keyboard. The heading
  stays pinned at the top; in the edit dialog Delete, Cancel and Save stay pinned at
  the bottom, with the fields scrolling between them. Notes use the spare height.
  Sheet buttons are at least 44px tall.
- **No keyboard on open (touch).** Opening a task on a touch device no longer focuses
  the title field; tapping a field brings the keyboard up.
- **Scroll containment.** The page behind an open dialog does not scroll, on any
  screen size.
- **Stacked board scrolls as a page.** On small screens the page grows with its
  content and scrolls as a whole, with space below the last quadrant.
- **Add form focus loop.** While the add form is open, Tab moves input → Add → Cancel
  → input, and Shift+Tab the reverse.
- **Only Do has a surface.** Plan, Delegate and Eliminate become see-through; Do stays
  the white raised card. (Updates the "Do is the one raised quadrant" requirement in
  the unarchived `add-demo-tasks-and-inline-due` change, in place.)

## Capabilities

### New Capabilities

None.

### Modified Capabilities
- `task-management`: adds the small-screen behaviour of the edit dialog.
- `matrix-board`: adds how the stacked board scrolls on small screens.
- `keyboard-navigation`: adds the focus loop in the add form.

## Impact

- `styles/dialog.css` (sheet layout, scroll containment), `styles/board.css`
  (stacked page scrolling, see-through quadrants), `styles/tokens.css` (comment).
- New `src/ui/viewport.js` (visible-viewport CSS variables); `src/main.js`,
  `src/ui/dialogs.js` (focus on open), `src/ui/render.js` (focus loop), `sw.js`
  (precache list), `index.html` (viewport meta, focusable heading).
- Tests: new `tests/e2e/mobile.spec.js`; additions to `tests/e2e/appearance.spec.js`.
- No data changes, no new dependencies.
