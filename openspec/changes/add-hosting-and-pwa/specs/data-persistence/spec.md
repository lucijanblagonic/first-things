# Spec Delta

## ADDED Requirements

### Requirement: Export tasks to a file
The user SHALL be able to export all tasks on the board to a file on their own device from Settings. The file SHALL use the same versioned JSON format as stored task data, so that a file exported by the app can later be imported by the same or a later version of the app. Exporting SHALL NOT change the board and SHALL NOT send any data over the network. Preferences (theme, layout, shortcut settings) SHALL NOT be included in the file.

#### Scenario: Export a board
- **WHEN** the user has tasks on the board and chooses Export in Settings
- **THEN** a JSON file is saved to the user's device containing the format version and every task with its quadrant, order, notes, due date and completion state, and the board is unchanged

#### Scenario: Export an empty board
- **WHEN** the board has no tasks and the user chooses Export
- **THEN** a valid file with an empty task list is saved

#### Scenario: Export file name
- **WHEN** the user exports on 2 October 2026
- **THEN** the suggested file name contains the app name and the date `2026-10-02`

### Requirement: Import tasks from a file
The user SHALL be able to import tasks from a previously exported file from Settings. Importing SHALL replace all tasks on the board with the tasks in the file; it SHALL NOT merge them. Before anything is replaced, the app SHALL ask the user to confirm, stating how many tasks are on the board now and how many are in the file. If the user does not confirm, nothing SHALL change. Before replacing a board that has tasks, the app SHALL keep a copy of the current task data under a separate backup key in local storage. After a confirmed import, the imported tasks SHALL be saved automatically like any other change. Importing SHALL NOT change preferences and SHALL NOT send any data over the network.

#### Scenario: Import replaces the board
- **WHEN** the board has 3 tasks and the user imports a valid file containing 5 tasks and confirms
- **THEN** the board shows exactly the 5 tasks from the file, in the quadrants, order and completion state recorded in the file, and the user is told that 5 tasks were imported

#### Scenario: Confirmation states both counts
- **WHEN** the board has 3 tasks and the user chooses a valid file containing 5 tasks
- **THEN** the app asks for confirmation and the message states that 3 tasks will be replaced by 5 tasks, before any task is changed

#### Scenario: Cancelling an import
- **WHEN** the user chooses a valid file and then cancels at the confirmation
- **THEN** the board and the stored data are unchanged

#### Scenario: Imported tasks survive reload
- **WHEN** the user confirms an import and then reloads the page
- **THEN** the board shows the imported tasks

#### Scenario: Previous board is kept as a backup
- **WHEN** the user confirms an import on a board that has tasks
- **THEN** the task data from before the import is stored under a separate backup key

#### Scenario: Round trip
- **WHEN** the user exports a board, deletes every task, and imports the exported file
- **THEN** the board is identical to the board at the time of the export

#### Scenario: Preferences untouched
- **WHEN** the user has chosen the Dark theme and the urgent-left layout and then imports a file
- **THEN** the theme and layout are unchanged

### Requirement: Copy and paste a board through the clipboard
The user SHALL be able to copy all tasks on the board to the clipboard as text from Settings, and to import tasks from text on the clipboard. The copied text SHALL be the same content an exported file would contain, so that text copied on one device and pasted on another transfers the board. Importing from the clipboard SHALL follow the same rules as importing from a file: it replaces the board, only after a confirmation that states both task counts, keeps a backup of the previous board, and rejects content it cannot use. If the browser does not let the app read the clipboard, the app SHALL offer a text field into which the user can paste the text themselves, with the same result. Copying SHALL NOT change the board, and neither copying nor pasting SHALL send any data over the network.

#### Scenario: Copy a board
- **WHEN** the user has 4 tasks on the board and chooses Copy in Settings
- **THEN** the clipboard holds text containing the format version and all 4 tasks, the board is unchanged, and the user is told that 4 tasks were copied

#### Scenario: Paste replaces the board after confirmation
- **WHEN** the clipboard holds text copied from a board with 5 tasks, the current board has 3 tasks, and the user chooses Paste
- **THEN** the app asks for confirmation stating that 3 tasks will be replaced by 5 tasks, and on confirming the board shows exactly those 5 tasks

#### Scenario: Copy on one device, paste on another
- **WHEN** the user copies a board in one browser and pastes it into the app in a different browser that shares the clipboard
- **THEN** after confirming, the second browser's board is identical to the first

#### Scenario: Clipboard does not hold a board
- **WHEN** the user chooses Paste while the clipboard holds unrelated text or is empty
- **THEN** a message says the clipboard does not contain a Decision Matrix board and that nothing was changed, and the board is unchanged

#### Scenario: Browser will not let the app read the clipboard
- **WHEN** the user chooses Paste and the browser refuses or does not support reading the clipboard
- **THEN** a text field appears where the user can paste the text, and importing from that field behaves the same as importing from the clipboard

#### Scenario: Copy is not possible
- **WHEN** the user chooses Copy and the browser refuses to write to the clipboard
- **THEN** a message says the board could not be copied and suggests exporting a file instead, and the board is unchanged

### Requirement: Import rejects files it cannot use
If the chosen file is not valid JSON, does not match the task data format, contains two tasks with the same identifier, or was created by a newer version of the format than the app supports, the app SHALL reject it, tell the user why in plain language, and leave the board and the stored data unchanged. The confirmation step SHALL NOT be shown for a rejected file. The same rules SHALL apply to text imported from the clipboard or from the paste field.

#### Scenario: Not a board file
- **WHEN** the user chooses a file that is not valid JSON or is not in the task data format
- **THEN** a message says the file is not a Decision Matrix export and that nothing was changed, and the board is unchanged

#### Scenario: File from a newer version
- **WHEN** the user chooses a file whose format version is greater than the app supports
- **THEN** a message says the file was made by a newer version of the app and that nothing was changed, and the board is unchanged

#### Scenario: Import when changes cannot be saved over newer data
- **WHEN** the stored data was created by a newer version of the app (so changes are not being saved) and the user tries to import a file
- **THEN** the import is refused with a message and the stored data is not modified
