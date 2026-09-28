# Spec Delta

## Purpose

Provides minimalist light and dark appearances that follow the operating system by default and can be overridden and remembered by the user.

## ADDED Requirements

### Requirement: Theme preference
The system SHALL support three theme preferences: System (default), Light, and Dark. With System, the theme SHALL follow the OS color-scheme setting and update live when it changes. A header control SHALL cycle System → Light → Dark → System and SHALL expose the current preference in its accessible name.

#### Scenario: Default follows OS
- **WHEN** a first-time user whose OS is in dark mode opens the app
- **THEN** the dark theme is used and the theme control reports "System"

#### Scenario: Live OS change
- **WHEN** the preference is System and the OS switches from light to dark
- **THEN** the app switches to dark without a reload

#### Scenario: Manual override
- **WHEN** the user selects Light while the OS is in dark mode
- **THEN** the light theme is used regardless of the OS setting

### Requirement: Theme persistence without flash
The chosen theme preference SHALL be saved locally and applied before the first paint on later visits, so the page never briefly shows the wrong theme.

#### Scenario: Reload with Dark preference
- **WHEN** the user has chosen Dark and reloads the page on a light OS
- **THEN** the page renders dark from the first frame

### Requirement: Contrast in both themes
In both themes, body text SHALL meet a contrast ratio of at least 4.5:1, and UI component boundaries, icons, quadrant accents and focus indicators at least 3:1. Completed (struck-through) task text SHALL still meet 4.5:1.

#### Scenario: Completed text contrast
- **WHEN** a completed task is displayed in either theme
- **THEN** its de-emphasised text still has at least 4.5:1 contrast against its background

### Requirement: Minimal visual style
The interface SHALL use one neutral base palette with a single accent color, one distinct accent tint per quadrant (with Do now the most prominent), a system font stack, and no decorative imagery, so the tasks stay the main focus.

#### Scenario: Consistent tokens
- **WHEN** the theme changes
- **THEN** only color values change; layout, spacing and typography stay the same
