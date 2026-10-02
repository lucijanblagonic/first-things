# Spec Delta

## MODIFIED Requirements

### Requirement: Theme preference
The system SHALL support three theme preferences: System (default), Light, and Dark. With System, the theme SHALL follow the OS color-scheme setting and update live when it changes. A header icon button SHALL cycle System → Light → Dark → System. Its icon SHALL reflect the current preference (monitor for System, sun for Light, moon for Dark); its accessible name and tooltip SHALL state the current preference (e.g. "Theme: System"). Changing the preference SHALL be announced through the polite live region.

#### Scenario: Default follows OS
- **WHEN** a first-time user whose OS is in dark mode opens the app
- **THEN** the dark theme is used and the theme button shows the monitor icon and reports "Theme: System"

#### Scenario: Live OS change
- **WHEN** the preference is System and the OS switches from light to dark
- **THEN** the app switches to dark without a reload

#### Scenario: Manual override
- **WHEN** the user activates the theme button until it reports "Theme: Light" while the OS is in dark mode
- **THEN** the light theme is used regardless of the OS setting and the button shows the sun icon
