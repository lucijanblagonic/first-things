# Spec Delta

## Purpose

Gives the user one place to adjust how the app looks and behaves (quadrant layout direction, keyboard shortcuts) and to look up every shortcut.

## ADDED Requirements

### Requirement: Settings dialog
The system SHALL provide a modal "Settings" dialog, opened from a gear icon button in the header, with `?` (when single-key shortcuts are on), and with `Ctrl/⌘ + ,`. It SHALL close with Escape, its close button, or a click on the backdrop, and focus SHALL return to the element that was focused before it opened. The dialog SHALL contain, in this order, titled sections: "Layout", "Keyboard", and "Shortcuts". Changes SHALL apply immediately (no Save button).

#### Scenario: Open settings with the keyboard
- **WHEN** a task is focused and the user presses `⌘ + ,` (or `Ctrl + ,`)
- **THEN** the Settings dialog opens with focus on its first control, and on Escape it closes and focus returns to the task

#### Scenario: Sections present
- **WHEN** the Settings dialog is open
- **THEN** it shows the "Layout", "Keyboard" and "Shortcuts" section headings in that order

#### Scenario: Settings open while typing
- **WHEN** the add input is focused and the user presses `⌘ + ,`
- **THEN** the Settings dialog opens (the modifier shortcut is not blocked by the text field)

### Requirement: Quadrant layout direction
The "Layout" section SHALL offer a radio group "Urgent column" with two options: "Right" (default; Do top-right, Plan top-left, Delegate bottom-right, Eliminate bottom-left) and "Left" (Do top-left, Plan top-right, Delegate bottom-left, Eliminate bottom-right). Each option SHALL show a small monochrome diagram of the resulting layout. Changing the option SHALL immediately swap the board's columns and the column axis headers. The Important row SHALL always be the top row. Quadrant identities, priority numbers, jump keys (`1`–`4`), task data, DOM order and Tab order SHALL NOT change.

#### Scenario: Switch to classic layout
- **WHEN** the user selects "Left" in Settings
- **THEN** Do moves to the top-left and Plan to the top-right, "Urgent" is shown above the left column and "Not urgent" above the right column, and all tasks stay in their quadrants

#### Scenario: Jump keys follow priority, not position
- **WHEN** the layout is "Left" and the user presses `1`
- **THEN** focus moves to Do (now top-left)

### Requirement: Settings persistence
The layout direction and the single-key shortcuts setting SHALL be saved locally and restored on later visits. The layout direction SHALL be applied before first paint so the board never visibly jumps between layouts on load. If local storage is unavailable, settings SHALL still work for the current session.

#### Scenario: Layout survives reload without a jump
- **WHEN** the user has chosen "Left" and reloads the page
- **THEN** Do is rendered top-left from the first frame

### Requirement: Settings legibility in both themes
In both light and dark themes, the Settings dialog SHALL: keep keycaps visually distinct from the dialog surface (keycap border at least 3:1 against the dialog background), show dividers between shortcut groups in a neutral that is clearly distinguishable from the dialog surface, show a hover state on buttons that differs from their resting background, and meet the text contrast rules of the theming capability. The shortcuts reference SHALL group shortcuts under short headings (Navigate, Tasks, App) and SHALL fit within the dialog without horizontal scrolling at widths down to 320px.

#### Scenario: Dark mode keycaps readable
- **WHEN** the Settings dialog is open in the dark theme
- **THEN** every keycap's border contrasts at least 3:1 with the dialog background and its text at least 4.5:1

#### Scenario: Narrow viewport
- **WHEN** the Settings dialog is open at 320px width
- **THEN** there is no horizontal scrolling inside the dialog or the page
