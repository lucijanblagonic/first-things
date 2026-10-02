# data-persistence Specification

## Purpose
Keeps the user's tasks and preferences across reloads in the browser, behind a replaceable storage adapter so cross-device sync can be added later without changing the app's behaviour.

## Requirements

### Requirement: Automatic local saving
Every change to tasks SHALL be saved automatically without an explicit save action, so that reloading or reopening the browser restores the exact board state (tasks, order, quadrants, completion state).

#### Scenario: Survive reload
- **WHEN** the user creates, edits, completes, reorders and moves tasks and then reloads the page
- **THEN** the board shows the same tasks in the same quadrants and order with the same data

### Requirement: Storage adapter contract
All reads and writes of task data SHALL go through a storage adapter with a documented, asynchronous load/save contract, so that a different adapter can replace the localStorage one without changes to task or UI behaviour. The POC SHALL ship exactly one adapter, backed by the browser's localStorage.

#### Scenario: Swappable adapter
- **WHEN** the app is started with an in-memory adapter (as unit tests do)
- **THEN** all task operations behave identically to the localStorage adapter

### Requirement: Versioned data format
Stored task data SHALL be a JSON document containing a format version number and the list of tasks. Loading data with an older known version SHALL migrate it; loading data with a newer unknown version SHALL NOT overwrite it and SHALL show a message that the data was created by a newer version.

#### Scenario: Newer version present
- **WHEN** stored data has a version greater than the app supports
- **THEN** the app shows an explanatory message, does not modify the stored data, and does not save changes over it

### Requirement: Corrupt data handling
If stored data cannot be parsed or fails validation, the system SHALL preserve the raw data under a separate backup key, start with an empty board, and tell the user that a backup was kept.

#### Scenario: Invalid JSON
- **WHEN** the stored value is not valid JSON
- **THEN** the raw value is copied to a backup key, the board starts empty, and a notice is shown

### Requirement: Storage unavailable
If localStorage is unavailable or a write fails (e.g. private mode, quota exceeded), the app SHALL keep working in memory and show a persistent, non-blocking warning that changes will not be saved.

#### Scenario: Write fails
- **WHEN** saving throws a quota error
- **THEN** the change is still visible on the board and a warning says changes are not being saved

### Requirement: Multiple tabs
When the stored data is changed by another tab of the app, the open tab SHALL reload its state from storage so the tabs do not overwrite each other with stale data.

#### Scenario: Edit in another tab
- **WHEN** the app is open in two tabs and the user adds a task in tab A
- **THEN** tab B shows the new task without a manual reload

### Requirement: Data stays local
The app SHALL NOT send task data or preferences to any network service.

#### Scenario: No network requests for data
- **WHEN** the user performs any task operation
- **THEN** no network request containing task data is made
