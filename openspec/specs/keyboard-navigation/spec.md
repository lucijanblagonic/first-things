# keyboard-navigation Specification

## Purpose
Makes the app fully operable from the keyboard in a fast, Linear-style way and accessible to assistive technology users, meeting WCAG 2.2 AA.

## Requirements

### Requirement: Keyboard shortcuts
The system SHALL support the following shortcuts. Single-key shortcuts SHALL NOT fire while focus is in a text input, textarea, date input or select, and SHALL NOT fire when Ctrl, ⌘ or Alt is held unless listed with that modifier. Digit shortcuts SHALL be matched by physical key so they work with Shift on any keyboard layout.

| Keys | Action |
|------|--------|
| `1` `2` `3` `4` | Focus the quadrant with that priority (Do, Plan, Delegate, Eliminate) |
| `↑` / `↓` (also `k` / `j`) | Focus previous / next task in the current quadrant |
| `←` / `→` (also `h` / `l`) | Focus the spatially adjacent quadrant to the left / right |
| `n` or `c` | Open the add input in the current quadrant (Do if none) |
| `Enter` or `e` | Open the edit dialog for the focused task |
| `x` or `Space` | Toggle completion of the focused task |
| `Backspace` or `Delete` | Delete the focused task (with undo) |
| `Ctrl/⌘ + z` | Undo the last delete while undo is available |
| `Ctrl/⌘ + ↑` / `↓` | Move the focused task up / down within its quadrant |
| `Ctrl/⌘ + ←` / `→` | Move the focused task to the spatially adjacent quadrant |
| `Shift + 1–4` | Move the focused task to that quadrant (appended to the end) |
| `?` | Open the keyboard shortcuts help dialog |
| `Escape` | Close the open dialog, cancel the add input, or collapse an expanded completed list |

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
- **WHEN** focus is in Plan (top-left) and the user presses `→`
- **THEN** focus moves to Do (top-right)

### Requirement: Focus model
The board SHALL use a single-tab-stop-per-list model: Tab moves between quadrants and major controls, and arrow keys move between tasks within a quadrant. Each quadrant SHALL remember its last focused task. After a task is deleted, focus SHALL move to the next task in the same list, or the previous one if it was last, or the quadrant's add control if the list is empty.

#### Scenario: Focus after delete
- **WHEN** the second of three tasks is focused and deleted
- **THEN** focus moves to the task that was third

#### Scenario: Tab order
- **WHEN** the user presses Tab repeatedly from the top of the page
- **THEN** focus visits the header controls, then each quadrant's task list and add control in priority order (Do, Plan, Delegate, Eliminate), without visiting every task individually

### Requirement: Visible focus
Every focusable element SHALL show a clearly visible focus indicator with at least 3:1 contrast against adjacent colors in both themes, and the focused element SHALL NOT be fully hidden by other content.

#### Scenario: Focus ring visible
- **WHEN** a task receives keyboard focus in either theme
- **THEN** a focus indicator is visible around the task

### Requirement: Shortcut help
The system SHALL provide a help dialog listing all shortcuts, opened with `?` and from a visible header button, and closed with Escape or its close button.

#### Scenario: Open help
- **WHEN** the user presses `?`
- **THEN** a modal dialog lists all shortcuts and receives focus

### Requirement: Visible shortcut hints
Controls that have a keyboard shortcut SHALL show it as a keycap (`<kbd>`) inside the control, next to its label, so shortcuts are discoverable without opening the help dialog. At minimum: the "Add task" button (`N`), the header shortcuts help button (`?`), the edit dialog's Save (`⌘↵` / `Ctrl ↵`) and Cancel (`Esc`) buttons, and the undo notification's Undo button (`⌘Z` / `Ctrl Z`). Empty-state hints and the help dialog SHALL also render keys as keycaps. The modifier SHALL be shown as `⌘` on Apple platforms and `Ctrl` elsewhere. Keycaps SHALL be visual only: they SHALL NOT change the control's accessible name, and the shortcut SHALL be exposed with `aria-keyshortcuts`. Keycaps for single-character shortcuts SHALL be hidden while single-key shortcuts are turned off, and all keycaps SHALL be hidden on devices without hover capability.

#### Scenario: Add button shows its shortcut
- **WHEN** a quadrant's "Add task" button is displayed on a desktop browser
- **THEN** it shows an `N` keycap next to its label

#### Scenario: Keycap does not change the accessible name
- **WHEN** a screen reader focuses the "Add task" button
- **THEN** it is announced as "Add task" and exposes `aria-keyshortcuts="N"`

#### Scenario: Hints follow the single-key setting
- **WHEN** the user turns single-key shortcuts off
- **THEN** the `N` and `?` keycaps are hidden, while the `⌘↵`, `Esc` and `⌘Z` keycaps remain visible

### Requirement: Single-key shortcuts can be turned off
The help dialog SHALL contain a setting to turn single-character shortcuts off (default: on), persisted locally. When off, only shortcuts that use Ctrl/⌘, Escape, Enter, arrow keys and Space remain active (WCAG 2.1.4).

#### Scenario: Disable single-key shortcuts
- **WHEN** the user turns single-key shortcuts off and then presses `x` on a focused task
- **THEN** nothing happens, and after reload the setting is still off

### Requirement: Screen reader announcements
The system SHALL announce the result of non-obvious actions through a polite live region, including: task created, completed/uncompleted, deleted (with undo hint), restored, reordered (new position), and moved (destination quadrant).

#### Scenario: Announce move
- **WHEN** the user moves a task to Plan with the keyboard
- **THEN** a screen reader announces something equivalent to "Moved ‘Write roadmap’ to Plan"

### Requirement: Accessible controls
All controls SHALL have accessible names; the completion control SHALL be a real checkbox labelled with the task title; drag & drop SHALL never be the only way to do an action; pointer targets SHALL be at least 24×24 CSS pixels; animations SHALL be reduced or removed when the user prefers reduced motion.

#### Scenario: Automated accessibility scan
- **WHEN** an automated axe scan runs on the board with tasks, the edit dialog open, and the help dialog open, in both themes
- **THEN** it reports no violations at WCAG 2.2 A/AA level
