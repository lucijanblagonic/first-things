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

### Requirement: Do is the one raised quadrant
All four quadrants SHALL share the same surface and border width, so their contents align. The Do quadrant alone SHALL appear raised, by means of a shadow, and SHALL NOT be emphasised by an outline that could be mistaken for a focus indicator. In the dark theme, where a shadow is hard to see, Do MAY additionally use a lighter surface than the other three.

#### Scenario: Light theme
- **WHEN** the board is shown in the light theme
- **THEN** all four quadrants are the same white surface, and only Do has a shadow

#### Scenario: Dark theme
- **WHEN** the board is shown in the dark theme
- **THEN** Plan, Delegate and Eliminate share one surface, and Do has a shadow and is distinguishable from them

## REMOVED Requirements

### Requirement: Quadrant task list and counts
**Reason**: The per-quadrant count and the empty-quadrant hint were removed to quieten the board; the list itself is unchanged.
**Migration**: Replaced by "Quadrant task list" above, which keeps the list behaviour and states that no count or placeholder is shown.
