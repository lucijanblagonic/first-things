# Spec Delta

## MODIFIED Requirements

### Requirement: Keyboard shortcuts
The system SHALL support the following shortcuts. Single-key shortcuts SHALL NOT fire while focus is in a text input, textarea, date input or select, and SHALL NOT fire when Ctrl, ⌘ or Alt is held unless listed with that modifier. Digit shortcuts SHALL be matched by physical key so they work with Shift on any keyboard layout. "Left" and "right" refer to the board as currently displayed, so they follow the layout direction setting.

| Keys | Action |
|------|--------|
| `1` `2` `3` `4` | Focus the quadrant with that priority (Do, Plan, Delegate, Eliminate) |
| `↑` / `↓` (also `k` / `j`) | Focus previous / next task in the current quadrant |
| `←` / `→` (also `h` / `l`) | Focus the visually adjacent quadrant to the left / right |
| `n` or `c` | Open the add input in the current quadrant (Do if none) |
| `Enter` or `e` | Open the edit dialog for the focused task |
| `x` or `Space` | Toggle completion of the focused task |
| `Backspace` or `Delete` | Delete the focused task (with undo) |
| `Ctrl/⌘ + z` | Undo the last delete while undo is available |
| `Ctrl/⌘ + ↑` / `↓` | Move the focused task up / down within its quadrant |
| `Ctrl/⌘ + ←` / `→` | Move the focused task to the visually adjacent quadrant |
| `Shift + 1–4` | Move the focused task to that quadrant (appended to the end) |
| `?` | Open Settings |
| `Ctrl/⌘ + ,` | Open Settings (also works while typing and with single-key shortcuts off) |
| `Escape` | Close the open dialog or tooltip, cancel the add input, or collapse an expanded completed list |

#### Scenario: Jump to quadrant
- **WHEN** the user presses `2` while no input is focused
- **THEN** focus moves to the first task of the Plan quadrant, or to the Plan quadrant's add control if it has no active tasks

#### Scenario: Shortcuts ignored while typing
- **WHEN** the add input is focused and the user types "x"
- **THEN** the letter x is entered in the input and no task is toggled

#### Scenario: Move with keyboard keeps focus
- **WHEN** a task in Plan is focused and the user presses `Shift+1`
- **THEN** the task moves to the end of Do and keyboard focus stays on the moved task

#### Scenario: Spatial quadrant navigation
- **WHEN** the layout is the default, focus is in Plan (top-left) and the user presses `→`
- **THEN** focus moves to Do (top-right)

#### Scenario: Spatial navigation follows the layout
- **WHEN** the layout direction is "Left", focus is in Do (top-left) and the user presses `→`
- **THEN** focus moves to Plan (top-right)

### Requirement: Visible shortcut hints
Controls that have a keyboard shortcut SHALL show it as a keycap (`<kbd>`) next to their label, so shortcuts are discoverable without opening Settings. At minimum: the "Add task" button (`N`), the edit dialog's Save (`⌘↵` / `Ctrl ↵`) and Cancel (`Esc`) buttons, and the undo notification's Undo button (`⌘Z` / `Ctrl Z`). Icon-only header buttons SHALL show their shortcut inside their tooltip instead (Settings: `?`, and `⌘,` / `Ctrl ,` when single-key shortcuts are off). Empty-state hints and the Settings shortcuts reference SHALL also render keys as keycaps. The modifier SHALL be shown as `⌘` on Apple platforms and `Ctrl` elsewhere. Keycaps SHALL be visual only: they SHALL NOT change the control's accessible name, and the shortcut SHALL be exposed with `aria-keyshortcuts`. Keycaps for single-character shortcuts SHALL be hidden while single-key shortcuts are turned off, and all keycaps outside the Settings reference SHALL be hidden on devices without hover capability.

#### Scenario: Add button shows its shortcut
- **WHEN** a quadrant's "Add task" button is displayed on a desktop browser
- **THEN** it shows an `N` keycap next to its label

#### Scenario: Keycap does not change the accessible name
- **WHEN** a screen reader focuses the "Add task" button
- **THEN** it is announced as "Add task" and exposes `aria-keyshortcuts="N"`

#### Scenario: Settings button exposes both shortcuts
- **WHEN** a screen reader focuses the Settings button with single-key shortcuts on
- **THEN** it is announced as "Settings" and exposes `aria-keyshortcuts="? Meta+Comma"` (or `Control+Comma` on non-Apple platforms)

#### Scenario: Hints follow the single-key setting
- **WHEN** the user turns single-key shortcuts off
- **THEN** the `N` keycap and the `?` keycap in the Settings tooltip are hidden (the tooltip shows `⌘,` instead), while the `⌘↵`, `Esc` and `⌘Z` keycaps remain visible

### Requirement: Single-key shortcuts can be turned off
The "Keyboard" section of the Settings dialog SHALL contain a setting to turn single-character shortcuts off (default: on), persisted locally. When off, only shortcuts that use Ctrl/⌘, Escape, Enter, arrow keys and Space remain active (WCAG 2.1.4).

#### Scenario: Disable single-key shortcuts
- **WHEN** the user turns single-key shortcuts off in Settings and then presses `x` on a focused task
- **THEN** nothing happens, and after reload the setting is still off

### Requirement: Accessible controls
All controls SHALL have accessible names; the completion control SHALL be a real checkbox labelled with the task title; drag & drop SHALL never be the only way to do an action; pointer targets SHALL be at least 24×24 CSS pixels; animations SHALL be reduced or removed when the user prefers reduced motion.

#### Scenario: Automated accessibility scan
- **WHEN** an automated axe scan runs on the board with tasks (in both layout directions), the edit dialog open, the Settings dialog open, and a header tooltip visible, in both themes
- **THEN** it reports no violations at WCAG 2.2 A/AA level

## REMOVED Requirements

### Requirement: Shortcut help
**Reason**: The standalone "Keyboard shortcuts" help dialog is replaced by the Settings dialog, which includes the shortcuts reference.
**Migration**: See the settings capability, "Settings dialog" requirement; `?` now opens Settings.
