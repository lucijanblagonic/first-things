# task-management Specification

## Purpose
Defines what a task is and every operation the user can perform on tasks: creating, editing, completing, archiving, deleting, reordering and moving them between quadrants.

## Requirements

### Requirement: Task data
A task SHALL have: a unique id, a title (required, trimmed, 1–200 characters), optional notes (plain text, up to 5000 characters), an optional due date (calendar date without time), the quadrant it belongs to, its position within that quadrant, a creation timestamp, an updated timestamp, and a completion timestamp (empty when not completed).

#### Scenario: Title is required
- **WHEN** the user tries to create or save a task whose title is empty or only whitespace
- **THEN** the task is not created/saved and the user is told a title is required

#### Scenario: Title is trimmed
- **WHEN** the user creates a task titled "  Call Ana  "
- **THEN** the stored title is "Call Ana"

### Requirement: Create task
The user SHALL be able to create a task in any quadrant through an inline input at the bottom of that quadrant's active task list, opened by the quadrant's visible "Add task" control or by keyboard. Submitting creates the task at the end of the quadrant's open tasks and keeps the input open and empty for rapid entry. Cancelling closes the input without creating a task.

#### Scenario: Quick add
- **WHEN** the user opens the add input in the Plan quadrant, types "Write roadmap" and presses Enter
- **THEN** a new open task "Write roadmap" appears at the end of Plan's open tasks, and the input stays open and empty

#### Scenario: Cancel add
- **WHEN** the add input is open with text and the user presses Escape
- **THEN** the input closes, no task is created, and focus returns to the element that opened it

### Requirement: Edit task
The user SHALL be able to edit a task's title, notes, due date, and quadrant in an edit dialog. Saving applies all changes at once; cancelling discards them. The dialog SHALL be a modal dialog with focus trapped inside it while open, and focus SHALL return to the task when it closes.

#### Scenario: Save edits
- **WHEN** the user opens a task, changes its title, adds notes and a due date, and saves (button or Ctrl/⌘+Enter)
- **THEN** the task shows the new title, indicates that it has notes, shows the due date, and its updated timestamp changes

#### Scenario: Cancel edits
- **WHEN** the user changes fields in the edit dialog and presses Escape or Cancel
- **THEN** the task is unchanged

### Requirement: Task display
Each task in a list SHALL show its title, a completion checkbox, a notes indicator when notes exist, and its due date when set. A due date earlier than today on an open task SHALL be marked overdue using both text (e.g. "Overdue") and a distinct neutral visual style that does not rely on color (e.g. an inverted badge); a due date equal to today SHALL be labelled "Today".

#### Scenario: Overdue task
- **WHEN** an open task has a due date of yesterday
- **THEN** its due date is shown with an "Overdue" label and a distinct style that does not rely on color

#### Scenario: Due date does not move tasks
- **WHEN** a task's due date passes
- **THEN** the task stays in its current quadrant

### Requirement: Complete and uncomplete
The user SHALL be able to toggle a task's completion. Completing records the completion time; the task stays in place in its list, shown struck through and de-emphasised. Uncompleting clears the completion time and restores normal display.

#### Scenario: Complete a task
- **WHEN** the user checks the checkbox of an open task
- **THEN** the task stays in its position, is shown struck through, and the quadrant's open count decreases by one

#### Scenario: Uncomplete a task
- **WHEN** the user unchecks a task completed today
- **THEN** it returns to normal display and the open count increases by one

### Requirement: Automatic archiving of completed tasks
A task completed before the start of the current local calendar day SHALL be considered archived. Archived tasks SHALL NOT appear in the quadrant's active list; each quadrant SHALL instead show a collapsed "Completed (n)" disclosure control (hidden when n is 0) that, when expanded, lists that quadrant's archived tasks, most recently completed first, and can be collapsed again. Archiving SHALL be re-evaluated when the app loads, when it regains visibility/focus, and when the local date changes while the app is open.

#### Scenario: Task archives the next day
- **WHEN** a task was completed yesterday and the user opens the app today
- **THEN** the task is not in the active list, and the quadrant shows "Completed (1)" collapsed

#### Scenario: Task completed today stays visible
- **WHEN** a task was completed earlier today
- **THEN** it is still shown struck through in the active list

#### Scenario: Show and hide archived tasks
- **WHEN** the user activates "Completed (3)" in a quadrant
- **THEN** the three archived tasks are listed below the active list; activating the control again collapses the list

#### Scenario: Restore an archived task
- **WHEN** the user unchecks an archived task
- **THEN** it becomes open again and appears at the end of that quadrant's open tasks in the active list

### Requirement: Delete task with undo
The user SHALL be able to delete any task (active or archived). Deletion takes effect immediately and a non-blocking notification offers "Undo" for at least 5 seconds. Undo SHALL restore the task with all its data in its original quadrant and position. Only the most recent deletion needs to be undoable.

#### Scenario: Undo a delete
- **WHEN** the user deletes a task and activates "Undo" within 5 seconds
- **THEN** the task reappears in the same quadrant and position with the same title, notes, due date and completion state

#### Scenario: Deletion becomes final
- **WHEN** the user deletes a task and the undo notification expires or another task is deleted
- **THEN** the first task can no longer be restored

### Requirement: Reorder within a quadrant
The user SHALL be able to change a task's position within its quadrant by keyboard and by mouse drag & drop. The order SHALL be persisted.

#### Scenario: Reorder by drag
- **WHEN** the user drags the third task above the first task in the same quadrant
- **THEN** it becomes the first task and keeps that position after reload

### Requirement: Move between quadrants
The user SHALL be able to move a task to another quadrant by keyboard, by drag & drop onto another quadrant (dropped at the pointer position, or at the end if dropped on empty space), and via the quadrant field in the edit dialog. A moved task keeps all its other data.

#### Scenario: Move by drag
- **WHEN** the user drags a task from Delegate and drops it on the Do quadrant's empty area
- **THEN** the task appears at the end of Do's list and is removed from Delegate

#### Scenario: Visible drop target
- **WHEN** a task is being dragged over a quadrant
- **THEN** the quadrant and the insertion point are visibly highlighted
