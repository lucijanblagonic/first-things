# Design

## Context

See `proposal.md`. Dialogs are native `<dialog>` elements opened with `showModal()`,
styled in `styles/dialog.css` as centred boxes. Below 768px the board stacks into one
column (`styles/board.css`); `html, body { height: 100% }` and a flexible `.board`
(from the wide layout, where quadrants scroll internally) were still in force there.

## Goals / Non-Goals

**Goals:** a phone experience where nothing important hides behind the keyboard or
scrolls away; no change to dialogs on wide screens other than scroll containment.
**Non-Goals:** a separate mobile navigation, swipe gestures, larger touch targets on
the board's task rows (noted as a follow-up).

## Decisions

### D1. Full-screen sheet below 768px
Same breakpoint as the stacked board. `dialog` becomes `position: fixed`, full width,
no border or radius, `overflow-y: auto`. The edit form is a flex column with
`min-height: 100%`; the notes field grows to use spare height. *Alternative:* a
bottom sheet — on iOS a bottom-anchored element sits under the keyboard.

### D2. Size from the visual viewport
On phones the keyboard shrinks the visual viewport, not the layout viewport, so
`100dvh` still extends under it. `src/ui/viewport.js` copies
`visualViewport.height` / `.offsetTop` into `--vv-height` / `--vv-top` on resize and
scroll; the sheet uses `height: var(--vv-height, 100dvh)` and
`top: var(--vv-top, 0px)`. `interactive-widget=resizes-content` in the viewport meta
asks Chrome on Android to resize the layout viewport as well. Without
`visualViewport` the fallback is the full dynamic viewport height.

### D3. Pinned heading and actions
`position: sticky` inside the scrolling dialog: the heading at `top: 0`, the edit
dialog's `.dialog-actions` at `bottom: 0`, each with the dialog's background and a
divider. DOM and tab order are unchanged. The keycap hints inside the edit actions
are hidden at this size: with them, the three buttons were wider than a phone screen
on non-Apple platforms ("Ctrl" + "Enter"), pushing Save partly off the edge.

### D4. Focus on open by pointer type
`(pointer: coarse)` → focus the heading (`tabindex="-1"`, no ring) instead of the
title input; otherwise unchanged. This avoids raising the keyboard before the user
has decided what to edit.

### D5. Scroll containment
`html:has(dialog[open]) { overflow: hidden }` and `overscroll-behavior: contain` on
dialogs.

### D6. Stacked page scrolling
Inside the small-screen media query: `html, body { height: auto }`,
`body { min-height: 100dvh }`, `.board { flex: 0 0 auto; min-height: auto }` and a
larger bottom padding. The board now takes its content's height, so its padding
follows the last quadrant and the document, not `<body>`, is what scrolls.

### D7. Add form focus loop
A `keydown` handler on the form moves focus by hand among `[input, Add, Cancel]` on
Tab / Shift+Tab (`preventDefault`), rather than only wrapping at the ends, so the
loop is the same in Safari, which skips buttons when tabbing unless Full Keyboard
Access is on. Escape handling moves from the input to the form so it works from the
buttons too.

### D8. See-through quadrants
`.quadrant { background: transparent }`; `.quadrant-do` keeps `--color-surface-do`
and `--shadow-raised`. Row hover and the drop-target tint were already translucent
washes, so they work on the page background.

## Risks / Trade-offs

- [Visual viewport behaviour differs between iOS versions and browsers] → CSS
  fallbacks at every step; verified by emulation only, so a check on a real phone is
  a task.
- [Tab cannot leave an open add form] → intended; Escape and Cancel close it, and
  it matches how the dialogs trap focus.
- [`:has()` for the scroll lock] → supported by current Chrome, Safari and Firefox;
  without it the page behind simply scrolls as before.
