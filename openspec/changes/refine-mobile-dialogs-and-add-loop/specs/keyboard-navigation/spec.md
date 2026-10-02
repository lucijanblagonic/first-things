# Spec Delta

## ADDED Requirements

### Requirement: Add form focus loop
While a quadrant's add form is open, pressing Tab SHALL move focus through the form's controls in the order input, Add, Cancel, and from Cancel back to the input; Shift+Tab SHALL move in the reverse order. Focus SHALL NOT leave the form by Tab while it is open. Escape SHALL close the form from any of the three controls and return focus to where the form was opened from.

#### Scenario: Tabbing forward
- **WHEN** the add form is open with focus in the input and the user presses Tab three times
- **THEN** focus moves to Add, then Cancel, then back to the input

#### Scenario: Tabbing backward
- **WHEN** focus is in the input and the user presses Shift+Tab
- **THEN** focus moves to Cancel

#### Scenario: Escape from a button
- **WHEN** focus is on Add or Cancel and the user presses Escape
- **THEN** the form closes and focus returns to the "Add task" button
