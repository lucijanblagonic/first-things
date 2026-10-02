# Spec Delta

## ADDED Requirements

### Requirement: Moving a task shows where it goes
While a task is being dragged, the app SHALL show an insertion indicator at the exact position where the task would land and SHALL mark the quadrant it would land in. Showing the indicator SHALL NOT shift the other tasks. After a task has been moved, by dragging or by keyboard, its row SHALL be briefly highlighted at its new position. A move command that leaves the task where it is SHALL NOT highlight it.

#### Scenario: Dragging over a list
- **WHEN** the user drags a task over the upper half of another task in a list
- **THEN** an insertion indicator is shown directly above that task, the quadrant is marked as the drop target, and the other tasks stay where they are

#### Scenario: Drag ends
- **WHEN** the drag ends, by dropping or cancelling
- **THEN** the insertion indicator and the drop-target marking are removed

#### Scenario: Moved by keyboard
- **WHEN** the user moves the focused task down one position with the keyboard
- **THEN** the task appears at its new position, keeps focus, and is briefly highlighted

#### Scenario: Nothing to move
- **WHEN** the user tries to move the last task in a list further down
- **THEN** the task stays where it is and is not highlighted

### Requirement: Notes preview
A task that has notes SHALL show the first non-blank line of its notes under its title, on a single line, in smaller and weaker text than the title, cut off with an ellipsis if it does not fit. Further lines SHALL NOT be shown in the list. A task without notes SHALL show no preview.

#### Scenario: Task with notes
- **WHEN** a task's notes start with a blank line, then "Ask Maria for the figures", then another line
- **THEN** the row shows "Ask Maria for the figures" under the title and does not show the other line

#### Scenario: Long first line
- **WHEN** the first line of the notes is wider than the row
- **THEN** it stays on one line and ends with an ellipsis

#### Scenario: Task without notes
- **WHEN** a task has no notes
- **THEN** no preview is shown under its title

### Requirement: Add form takes the place of the add button
Opening the add-task form SHALL show the title input and its Add and Cancel actions on a single line, at the same position and height as the "Add task" button it replaces, so that opening it does not move other content. A validation message SHALL appear on its own line below the controls.

#### Scenario: Opening the form
- **WHEN** the user opens the add form in a quadrant
- **THEN** the input, Add and Cancel are on one line where the "Add task" button was, and the quadrant's heading and tasks have not moved

#### Scenario: Narrow screen
- **WHEN** the add form is opened on a phone-width screen
- **THEN** the input, Add and Cancel are still on one line

#### Scenario: Validation message
- **WHEN** the user submits an empty title
- **THEN** the message appears below the controls, which stay on one line
