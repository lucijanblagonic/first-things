# Spec Delta

## ADDED Requirements

### Requirement: Due date beside the title
A task's due date, including its "Overdue" or "Today" label, SHALL be shown on the same line as the task's title, directly after it. When the title is too long for the date to fit beside it, the date SHALL move below the title rather than be squeezed or cut off. The notes preview SHALL appear below the title and date.

#### Scenario: Overdue task
- **WHEN** an open task has a due date earlier than today
- **THEN** its "Overdue" label and date are shown to the right of its title on the same line

#### Scenario: Task with a date and notes
- **WHEN** a task has both a due date and notes
- **THEN** the date is beside the title and the first line of the notes is on the line below

#### Scenario: Long title
- **WHEN** a task's title fills the row
- **THEN** the due date is shown in full below the title

### Requirement: Example tasks on a first visit
When the app is opened in a browser where no board has ever been saved, the board SHALL start with three example tasks placed in different quadrants, which between them show an overdue date, a future date and notes. The examples SHALL be ordinary tasks that can be edited, completed, moved and deleted, and SHALL be saved like any other task. They SHALL be added only once: when any board has been saved in this browser, including an empty one, opening the app SHALL NOT add them again. Their dates SHALL be relative to the day of the first visit. Importing a board SHALL NOT add them.

#### Scenario: First visit
- **WHEN** the app is opened in a browser that has never saved a board
- **THEN** three example tasks are shown, one of them overdue, in three different quadrants

#### Scenario: Examples are kept like other tasks
- **WHEN** the user reloads after a first visit
- **THEN** the same three tasks are shown, not a second set

#### Scenario: Deleted examples stay deleted
- **WHEN** the user deletes all three example tasks and reloads
- **THEN** the board is empty

#### Scenario: Unreadable saved data
- **WHEN** saved data exists but cannot be read
- **THEN** the board starts empty with the usual notice and no example tasks are added
