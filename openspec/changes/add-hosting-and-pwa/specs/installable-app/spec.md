# Spec Delta

## Purpose

Lets people reach the app from any computer at a public URL, install it as a standalone app, keep using it without a network connection, and receive new versions without manual steps.

## ADDED Requirements

### Requirement: Public URL
The app SHALL be available at a public HTTPS URL that needs no account, login or local setup to open. The app SHALL work when served from a sub-path of its host, not only from the host root.

#### Scenario: Opening the URL on another computer
- **WHEN** a person opens the public URL in a supported browser on a computer that has never run the app
- **THEN** the board loads with four empty quadrants and is fully usable

#### Scenario: Served from a sub-path
- **WHEN** the app is served from a sub-path such as `/productivity-decision-matrix/`
- **THEN** every stylesheet, script, icon and the manifest loads successfully, with no failed requests

### Requirement: Separate board per browser
Opening the public URL SHALL NOT give any visitor access to another visitor's tasks. Each browser SHALL show only the tasks created in that same browser.

#### Scenario: Two people use the same URL
- **WHEN** one person adds tasks at the public URL and a second person opens the same URL in a different browser
- **THEN** the second person sees an empty board and none of the first person's tasks

### Requirement: Installable as a standalone app
The app SHALL provide the metadata browsers require to offer installation: a name, a short name, a start address inside the app, a standalone display mode, and icons at 192 and 512 pixels including one suitable for masking. Once installed, the app SHALL open in its own window without browser address bar or tabs, and SHALL start at the board.

#### Scenario: Browser offers installation
- **WHEN** the app is opened in a browser that supports installing web apps
- **THEN** the browser offers to install it under the name "First Things" with the app's icon

#### Scenario: Launching the installed app
- **WHEN** the user launches the installed app
- **THEN** it opens in its own window showing the board, with the same tasks as the browser it was installed from

#### Scenario: Icon in a browser tab
- **WHEN** the app is open in a browser tab
- **THEN** the tab shows the app's icon rather than a generic placeholder

### Requirement: Works offline after the first visit
After the app has been loaded once with a network connection, it SHALL load and be fully usable without a network connection, including adding, editing, completing, moving and deleting tasks. If offline support cannot be set up in a browser, the app SHALL still work normally while online and SHALL NOT show an error.

#### Scenario: Reload while offline
- **WHEN** the user has loaded the app once while online, then loses the network connection and reloads
- **THEN** the board renders with the user's tasks and no browser offline error page is shown

#### Scenario: Editing while offline
- **WHEN** the user adds a task while offline and reloads while still offline
- **THEN** the task is still there

#### Scenario: Offline support unavailable
- **WHEN** the app is opened in a browser or mode where offline support cannot be set up
- **THEN** the app loads and works as it does today, with no error message or banner about offline support

### Requirement: New versions are picked up automatically
When a new version of the app has been deployed, a user who loads the app while online SHALL get the new version on that load, without clearing site data, reinstalling, or any other manual step. Offline caching SHALL NOT keep serving an older version while the network is reachable.

#### Scenario: Loading after a deploy
- **WHEN** a new version is deployed and the user then loads the app while online
- **THEN** the app shown is the new version

#### Scenario: Offline after an update
- **WHEN** the user has loaded the new version once while online and then reloads while offline
- **THEN** the new version is shown, not the older one

### Requirement: Updates and offline caching preserve tasks
Installing the app, receiving a new version, and offline caching SHALL NOT delete or alter the user's tasks or preferences.

#### Scenario: Tasks survive an update
- **WHEN** the user has tasks saved and a new version of the app is loaded
- **THEN** all tasks and preferences are unchanged
