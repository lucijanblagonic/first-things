# Spec Delta

## ADDED Requirements

### Requirement: Quadrant task list
Each quadrant SHALL show its active tasks (not archived) in the user-defined order, with completed tasks struck through. The quadrant header SHALL NOT show a count of tasks. A quadrant with no active tasks SHALL show only its header and the control for adding a task, with no placeholder text.

#### Scenario: Open and completed tasks
- **WHEN** a quadrant contains 3 open tasks and 1 task completed today
- **THEN** the list shows all 4 tasks, with the completed one struck through, and the header shows no count

#### Scenario: Empty quadrant
- **WHEN** a quadrant has no active tasks
- **THEN** it shows its heading and the "Add task" control, and no "No tasks yet" text

### Requirement: Quadrant surfaces follow priority
The four quadrants SHALL differ in surface, in neutral tones only, so that priority is readable at a glance: Do SHALL be a raised card with the brightest surface and a shadow; Plan and Delegate SHALL be flat and let the page background show through; Eliminate SHALL be flat with a dimmed surface. All four SHALL keep the same border width so their contents align. Text on every surface SHALL keep the contrast required by the theming capability.

#### Scenario: Light theme
- **WHEN** the board is shown in the light theme
- **THEN** Do is white with a shadow, Plan and Delegate show the page background, and Eliminate is slightly greyer than the page

#### Scenario: Dark theme
- **WHEN** the board is shown in the dark theme
- **THEN** Do is lighter than the page with a shadow, Plan and Delegate show the page background, and Eliminate is slightly darker than the page

## REMOVED Requirements

### Requirement: Quadrant task list and counts
**Reason**: The per-quadrant count and the empty-quadrant hint were removed to quieten the board; the list itself is unchanged.
**Migration**: Replaced by "Quadrant task list" above, which keeps the list behaviour and states that no count or placeholder is shown.
