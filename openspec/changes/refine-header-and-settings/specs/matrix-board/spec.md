# Spec Delta

## MODIFIED Requirements

### Requirement: Four quadrants laid out on importance and urgency axes
The system SHALL render exactly four quadrants in a 2×2 grid where the top row holds the important quadrants. Which column holds the urgent quadrants SHALL follow the user's layout direction setting (see the settings capability): the right column by default, or the left column when "Urgent column: Left" is chosen. Each quadrant SHALL have a fixed identity, priority number, title (an action verb) and subtitle (its urgency and importance in words). Ids are internal and are not shown to the user. Default positions:

| Priority | Id      | Default position | "Left" position | Title     | Subtitle                     |
|----------|---------|------------------|-----------------|-----------|------------------------------|
| 1        | `do`    | top-right        | top-left        | Do        | Urgent and important         |
| 2        | `plan`  | top-left         | top-right       | Plan      | Important but not urgent     |
| 3        | `limit` | bottom-right     | bottom-left     | Delegate  | Urgent but not important     |
| 4        | `drop`  | bottom-left      | bottom-right    | Eliminate | Not urgent and not important |

#### Scenario: Board renders on first visit
- **WHEN** the user opens the app with no saved data
- **THEN** four quadrants are visible in the default positions defined above, each showing its priority number, title, subtitle, and an empty state

#### Scenario: Most important quadrant is emphasised
- **WHEN** the board is rendered in either layout direction
- **THEN** the `do` quadrant is visually emphasised compared to the others as the one raised card (a shadow and a brighter surface; Plan and Delegate are flat and see-through, and Eliminate is flat and dimmed) and by title weight, not color and not an outline that could be mistaken for a focus indicator

### Requirement: Axis headers
The system SHALL label the rows and columns so the meaning of each position is understandable without prior knowledge: an "Urgent" header above the urgent column and a "Not urgent" header above the other column (so their positions swap with the layout direction), an "Important" header beside the top row, and a "Not important" header beside the bottom row. Axis headers SHALL be rendered no smaller than task title text.

#### Scenario: Axis headers are visible
- **WHEN** the board is rendered at a viewport width of 768px or more with the default layout
- **THEN** "Not urgent" and "Urgent" are shown above the left and right columns, and "Important" and "Not important" are shown beside the top and bottom rows

#### Scenario: Axis headers follow the layout
- **WHEN** the layout direction is "Left"
- **THEN** "Urgent" is shown above the left column and "Not urgent" above the right column

## ADDED Requirements

### Requirement: App header
The page SHALL start with a header containing the app title "First Things" as the page's `h1` and two icon-only buttons on the right: theme and Settings. The title SHALL be the largest text on the page and larger than quadrant titles. The header SHALL have no border and no background different from the page background. Each icon button SHALL have an accessible name, a pointer target of at least 32×32 CSS pixels, and a tooltip with its name (and shortcut keycap, where one exists) that appears on hover and on keyboard focus, can be dismissed with Escape without moving focus, and stays visible while the pointer is over it (WCAG 1.4.13). Tooltips SHALL NOT be the only source of the accessible name.

#### Scenario: Quiet header
- **WHEN** the board is rendered
- **THEN** the header shows a large bold "First Things" title and two icon buttons, with no border line between the header and the board

#### Scenario: Tooltip on focus
- **WHEN** the user tabs to the Settings button
- **THEN** a tooltip reading "Settings" with a `?` keycap appears, and pressing Escape hides it while focus stays on the button

#### Scenario: Tooltip on hover
- **WHEN** the user hovers the theme button
- **THEN** a tooltip shows the current theme (e.g. "Theme: System")
