# Spec Delta

## ADDED Requirements

### Requirement: Stacked board scrolls as a page
On small screens, where the quadrants are stacked in one column, the page SHALL grow with its content and scroll as a whole, rather than scrolling inside a fixed-height region, and there SHALL be visible space between the last quadrant and the end of the page.

#### Scenario: Scrolling to the end
- **WHEN** the user scrolls to the end of the stacked board on a phone-sized screen
- **THEN** the last quadrant is fully visible with space below it
