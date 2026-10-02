# Spec Delta

## ADDED Requirements

### Requirement: Dialogs on small screens
On small screens, the edit dialog and the Settings dialog SHALL fill the visible screen. They SHALL be sized to the area that is actually visible, so that when an on-screen keyboard is shown the dialog ends above it. The dialog's heading SHALL stay visible at the top while its content scrolls; in the edit dialog the Delete, Cancel and Save actions SHALL stay visible at the bottom, and in Settings the close button SHALL stay visible. Buttons in these dialogs SHALL be at least 44px tall. While any dialog is open, on any screen size, the page behind it SHALL NOT scroll.

#### Scenario: Editing on a phone
- **WHEN** the user opens a task on a phone-sized screen
- **THEN** the edit dialog covers the whole screen, with "Edit task" at the top and Delete, Cancel and Save at the bottom

#### Scenario: Long notes
- **WHEN** the edit dialog's content is taller than the screen and the user scrolls to the end
- **THEN** the heading and the Delete, Cancel and Save actions are still visible

#### Scenario: On-screen keyboard
- **WHEN** an on-screen keyboard reduces the visible area while the edit dialog is open
- **THEN** the dialog shrinks to the visible area and Save and Cancel remain visible above the keyboard

#### Scenario: Scrolling Settings
- **WHEN** the user scrolls to the end of Settings on a phone-sized screen
- **THEN** the "Settings" heading and the close button are still visible

#### Scenario: Page behind a dialog
- **WHEN** a dialog is open and the user scrolls
- **THEN** the board behind the dialog does not move

### Requirement: No keyboard on opening a task by touch
On a device whose primary input is touch, opening the edit dialog SHALL NOT place focus in a text field, so that the on-screen keyboard appears only when the user taps a field. On other devices the title field SHALL be focused with its text selected, as before.

#### Scenario: Touch device
- **WHEN** the user taps a task on a touch device
- **THEN** the edit dialog opens with no field focused and no on-screen keyboard

#### Scenario: Mouse or keyboard device
- **WHEN** the user opens a task with a mouse or the keyboard
- **THEN** the title field is focused with its text selected
