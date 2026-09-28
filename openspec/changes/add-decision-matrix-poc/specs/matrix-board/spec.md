# Spec Delta

## Purpose

Presents the user's tasks on a four-quadrant importance/urgency board so priority is visible at a glance, with the most important quadrant in the top-right.

## ADDED Requirements

### Requirement: Four quadrants laid out on importance and urgency axes
The system SHALL render exactly four quadrants in a 2×2 grid where importance increases upward and urgency increases to the right. Each quadrant SHALL have a fixed identity, priority number, title and subtitle:

| Priority | Id      | Position     | Title    | Subtitle                    |
|----------|---------|--------------|----------|-----------------------------|
| 1        | `do`    | top-right    | Do now   | Important · Urgent          |
| 2        | `plan`  | top-left     | Plan     | Important · Not urgent      |
| 3        | `limit` | bottom-right | Limit    | Not important · Urgent      |
| 4        | `drop`  | bottom-left  | Drop     | Not important · Not urgent  |

#### Scenario: Board renders on first visit
- **WHEN** the user opens the app with no saved data
- **THEN** four quadrants are visible in the positions defined above, each showing its priority number, title, subtitle, and an empty state

#### Scenario: Most important quadrant is emphasised
- **WHEN** the board is rendered
- **THEN** the `do` quadrant (top-right) is visually emphasised compared to the others, and that emphasis does not rely on color alone (e.g. it also uses weight, border or label)

### Requirement: Axis labels
The system SHALL label the axes so the meaning of each position is understandable without prior knowledge: an "Importance" label along the vertical axis (more important at the top) and an "Urgency" label along the horizontal axis (more urgent at the right).

#### Scenario: Axis labels are visible
- **WHEN** the board is rendered at a viewport width of 768px or more
- **THEN** an "Importance" label is shown beside the vertical axis and an "Urgency" label is shown along the horizontal axis, each indicating direction

### Requirement: Quadrant task list and counts
Each quadrant SHALL show its active tasks (not archived) in the user-defined order, and a count of its open (not completed) tasks in its header.

#### Scenario: Count reflects open tasks
- **WHEN** a quadrant contains 3 open tasks and 1 task completed today
- **THEN** the quadrant header shows a count of 3 and the list shows all 4 tasks, with the completed one struck through

#### Scenario: Empty quadrant
- **WHEN** a quadrant has no active tasks
- **THEN** it shows a short empty-state hint telling the user how to add a task, including the keyboard shortcut

### Requirement: Quadrant overflow
A quadrant with more tasks than fit in its area SHALL scroll within the quadrant, keeping the quadrant header visible, and SHALL NOT change the size of the other quadrants.

#### Scenario: Many tasks in one quadrant
- **WHEN** a quadrant holds more tasks than fit in its visible area
- **THEN** its task list scrolls independently while the four quadrants keep equal size on wide viewports

### Requirement: Responsive layout
On viewports narrower than 768px the system SHALL stack the quadrants in a single column ordered by priority (Do now, Plan, Limit, Drop), keeping each quadrant's title and subtitle so the meaning is preserved without the 2×2 geometry. The page SHALL NOT scroll horizontally at any width down to 320px.

#### Scenario: Narrow viewport
- **WHEN** the viewport is 375px wide
- **THEN** the quadrants are shown in one column in priority order and there is no horizontal scrolling

### Requirement: Board landmarks and headings
The board SHALL expose a meaningful structure to assistive technologies: a main landmark for the board, each quadrant as a labelled region whose accessible name includes its title and subtitle, and each quadrant title as a heading.

#### Scenario: Screen reader navigates by region
- **WHEN** a screen reader user lists landmarks/regions
- **THEN** four regions are announced with names like "Do now — Important, Urgent"
