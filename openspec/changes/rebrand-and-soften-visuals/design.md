# Design

## Context

See `proposal.md`. Colours are tokens in `styles/tokens.css`, remapped per theme in
three blocks (light root, dark media query, explicit dark). Preferences that affect
first paint (theme, layout, single-key shortcuts) are applied by an inline script in
`index.html` that sets attributes on `<html>`, and are managed at runtime by
`src/ui/settings.js` and `src/ui/theme.js`.

## Goals / Non-Goals

**Goals:** a calmer default that still meets the `theming` contrast requirement; the
previous, stronger look kept as an option; no layout shift from emphasis or focus.

**Non-Goals:** a new colour palette (still monochrome), changing storage keys or the
URL, a separate wordmark or brand colours.

## Decisions

### D1. Two outline strengths via token indirection
Each theme block defines the soft values under the normal token names and the strong
ones as `--strong-*`. One block at the end of the file, `:root[data-contrast='high']`,
points the normal tokens at the strong values. This avoids a second copy of each
theme block per contrast level. *Alternative:* `@media (prefers-contrast: more)` in
CSS only — cannot be overridden by a user setting without duplicating blocks.

### D2. Contrast setting mirrors the layout setting
Key `decision-matrix:contrast` (`high` | `normal`), attribute `data-contrast='high'`
on `<html>`, applied by the inline head script and by `setHighContrast()` in
`src/ui/settings.js`. Both values are stored so an explicit "off" overrides the OS
preference; with nothing stored, the head script uses `prefers-contrast: more`.

### D3. Focus ring
2px ring in `--color-focus` (mid grey by default, 4.7:1 on white), offset 2px, the
same on text fields and buttons (an earlier draft drew the ring over a text field's
border; it read as inconsistent next to the buttons beside it). Task rows use
`outline-offset: -2px` because their list scrolls and would clip an outer ring. The
global `border-radius` override on `:focus-visible` is removed; it changed elements'
corner radius while focused.

### D4. Alignment by bleeding rows into the padding
`.task-list` gets a negative inline margin equal to a row's inline padding, so the
checkbox sits on the heading's left edge while hover and focus still cover a full
row. (The "Add task" button is not bled; see D10.)

### D5. Do quadrant emphasis without shift
Same 1px border width as the other quadrants, in the stronger border colour. In High
contrast an inset 1px box-shadow adds weight without changing the box size.

### D6. Drawn checkboxes
`appearance: none` with a clip-path tick, using the border and inverse tokens, so
checkboxes follow the contrast setting. Under `forced-colors` the native control is
restored. Radios stay native.

### D7. Name change keeps internal identifiers
Only user-visible strings change. `decision-matrix:*` storage keys, the
`decision-matrix-v1` cache name and the repository/URL stay, because changing them
would orphan existing boards and installed apps.

### D8. Logo
Three outlined squares and a filled top-right square (the Do quadrant in the default
layout). Icons use a 22-unit stroke on the 512 grid so the outlines survive at
16px. The header mark is the same shape as an inline SVG in `currentColor`.

### D9. Move feedback
Drag: the existing insertion element becomes zero-height with a negative block margin
that cancels the list gap, and draws a 2px bar in the focus colour via a
pseudo-element, so rows keep their positions while it moves. The target quadrant gets
a faint tint and the stronger border colour instead of a dashed outline (a heavier
bar with a dot and a ring around the quadrant was tried and was too loud). After any move (drop, `Ctrl/⌘ + arrows`,
`Shift + 1–4`), `flashMoved()` in `src/main.js` adds `task-moved` to the row, a 900ms
background fade. Rows are rebuilt on each render, so the class needs no cleanup. A
keyboard reorder at the top or bottom edge moves nothing and does not highlight.
Under reduced motion the fade is suppressed by the global rule; focus still marks
the row.

### D10. One-line add form
`.add-form` is a wrapping flex row: input (flexible), Add, Cancel, all at
`--add-row-height` (32px), the same as `.add-task-button`. The button no longer
bleeds left: its box starts at the content edge like the input, so its label sits
where typed text will. The validation message has `order: 1` and full width, so it
wraps onto its own line below. The input keeps a 16px font so iOS does not zoom.

### D11. Notes preview replaces the notes icon
`notesPreview(notes)` in `src/core/task.js` returns the first non-blank line, trimmed.
`src/ui/task-item.js` renders it as `.task-notes-preview` under the title (muted,
0.8rem, one line with ellipsis) and no longer renders the notes icon. The row's
accessible name still says "has notes".

## Risks / Trade-offs

- [Softer borders are closer to the 3:1 floor] → values chosen with margin (3.2:1
  worst case) and the axe scans run in both themes and in High contrast.
- [Drawn checkboxes can differ from platform conventions] → standard size, native
  semantics kept, native control restored under forced colours.
- [Installed apps keep the old name until the browser refreshes the manifest] →
  accepted; browsers update it on their own schedule.
- [The logo assumes the default layout (Do top-right)] → accepted; it is a mark, not
  a diagram of the user's board.
