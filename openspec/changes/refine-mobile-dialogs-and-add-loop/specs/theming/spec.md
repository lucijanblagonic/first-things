# Spec Delta

## ADDED Requirements

### Requirement: Three kinds of button
Every text button in the interface SHALL use one of three styles: primary (filled; the main action of a form), outline (bordered; an ordinary action) or basic (text only; a quiet action). No other text-button styles SHALL be used. Buttons of all three kinds in the same row SHALL have the same height. In High contrast, basic buttons SHALL also show an outline. Icon-only buttons are outside this requirement.

#### Scenario: Edit dialog actions
- **WHEN** the edit dialog is open
- **THEN** Save is a primary button, Cancel is an outline button and Delete is a basic button, all the same height

#### Scenario: Quiet actions
- **WHEN** the board is shown and a task has just been deleted
- **THEN** "Add task" and the toast's "Undo" are basic buttons with no border

### Requirement: Dialogs without divider lines
Dialogs SHALL separate their sections, heading and actions with spacing only, not with divider lines.

#### Scenario: Settings sections
- **WHEN** Settings is open
- **THEN** no line is drawn between its sections or between its shortcut groups

#### Scenario: Pinned heading and actions on a small screen
- **WHEN** the edit dialog is shown as a full-screen sheet
- **THEN** no line is drawn under its heading or above its actions
