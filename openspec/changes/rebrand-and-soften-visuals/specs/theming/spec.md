# Spec Delta

## ADDED Requirements

### Requirement: Contrast preference
The app SHALL offer two strengths of outline styling in both themes: a default with softer borders, keycaps and focus ring, and a High contrast option with stronger ones and outlined secondary buttons. In both strengths, control boundaries and the focus indicator SHALL keep a contrast ratio of at least 3:1 against their background. The user SHALL be able to turn High contrast on and off in Settings. Until the user has chosen, High contrast SHALL be on when the operating system asks for increased contrast and off otherwise. The choice SHALL be saved locally and applied before the first paint on later visits.

#### Scenario: Default look
- **WHEN** a user whose operating system does not ask for increased contrast opens the app for the first time
- **THEN** the softer look is used and the High contrast setting is shown as off

#### Scenario: Turning High contrast on
- **WHEN** the user turns High contrast on in Settings
- **THEN** borders, keycaps and the focus ring become stronger immediately, without a reload, in the current theme

#### Scenario: Choice persists
- **WHEN** the user has turned High contrast on and reloads the page
- **THEN** the page renders in High contrast from the first frame and the setting is shown as on

#### Scenario: Operating system preference
- **WHEN** the operating system asks for increased contrast and the user has not chosen a setting
- **THEN** High contrast is on

#### Scenario: Explicit choice wins over the operating system
- **WHEN** the operating system asks for increased contrast and the user turns High contrast off
- **THEN** the softer look is used, also after a reload

### Requirement: Focus indicators are fully visible
The focus indicator of every focusable element SHALL be visible on all sides and SHALL NOT be cut off by a scrolling or clipping container. Text fields and buttons SHALL show the same focus ring, so focus looks the same on every control. Showing focus or emphasis SHALL NOT move surrounding content.

#### Scenario: Focused task row
- **WHEN** a task row receives keyboard focus
- **THEN** the focus ring is visible on all four sides of the row

#### Scenario: Focused text field
- **WHEN** the add-task input receives focus and focus then moves to the Add button next to it
- **THEN** both show a ring of the same width, offset and colour

#### Scenario: Emphasised quadrant stays aligned
- **WHEN** the board is shown on a wide viewport
- **THEN** the Do quadrant's heading is at the same height as its neighbour's heading
