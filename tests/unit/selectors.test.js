import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addTask, toggleComplete } from '../../src/core/actions.js';
import { isArchived, activeTasks, archivedTasks, openCount, dueStatus } from '../../src/core/selectors.js';

const NOW = new Date(2026, 2, 5, 12, 0, 0); // March 5, noon
const TODAY_EARLY = new Date(2026, 2, 5, 0, 5, 0); // just after local midnight, same day
const YESTERDAY_LATE = new Date(2026, 2, 4, 23, 55, 0); // just before local midnight, previous day

test('isArchived: false for open task', () => {
  const [task] = addTask([], { title: 'A', quadrant: 'do' }, NOW);
  assert.equal(isArchived(task, NOW), false);
});

test('isArchived: false for a task completed today', () => {
  let tasks = addTask([], { title: 'A', quadrant: 'do' }, NOW);
  tasks = toggleComplete(tasks, { id: tasks[0].id }, NOW);
  assert.equal(isArchived(tasks[0], NOW), false);
});

test('isArchived: true for a task completed before local midnight of today', () => {
  let tasks = addTask([], { title: 'A', quadrant: 'do' }, YESTERDAY_LATE);
  tasks = toggleComplete(tasks, { id: tasks[0].id }, YESTERDAY_LATE);
  assert.equal(isArchived(tasks[0], NOW), true);
});

test('isArchived: boundary just after local midnight considers yesterday completion archived', () => {
  let tasks = addTask([], { title: 'A', quadrant: 'do' }, YESTERDAY_LATE);
  tasks = toggleComplete(tasks, { id: tasks[0].id }, YESTERDAY_LATE);
  assert.equal(isArchived(tasks[0], TODAY_EARLY), true);
});

test('activeTasks: includes open tasks and tasks completed today, sorted by order, excludes archived', () => {
  let tasks = addTask([], { title: 'Open', quadrant: 'do' }, NOW);
  tasks = addTask(tasks, { title: 'CompletedToday', quadrant: 'do' }, NOW);
  tasks = addTask(tasks, { title: 'CompletedYesterday', quadrant: 'do' }, YESTERDAY_LATE);
  tasks = toggleComplete(tasks, { id: tasks[1].id }, NOW);
  tasks = toggleComplete(tasks, { id: tasks[2].id }, YESTERDAY_LATE);

  const active = activeTasks(tasks, 'do', NOW);
  assert.deepEqual(active.map((t) => t.title), ['Open', 'CompletedToday']);
});

test('archivedTasks: sorted by completedAt descending (most recent first)', () => {
  let tasks = addTask([], { title: 'Older', quadrant: 'do' }, new Date(2026, 2, 3, 10, 0, 0));
  tasks = addTask(tasks, { title: 'Newer', quadrant: 'do' }, new Date(2026, 2, 4, 10, 0, 0));
  tasks = toggleComplete(tasks, { id: tasks[0].id }, new Date(2026, 2, 3, 10, 0, 0));
  tasks = toggleComplete(tasks, { id: tasks[1].id }, new Date(2026, 2, 4, 10, 0, 0));

  const archived = archivedTasks(tasks, 'do', NOW);
  assert.deepEqual(archived.map((t) => t.title), ['Newer', 'Older']);
});

test('openCount counts only tasks with no completedAt', () => {
  let tasks = addTask([], { title: 'A', quadrant: 'do' }, NOW);
  tasks = addTask(tasks, { title: 'B', quadrant: 'do' }, NOW);
  tasks = addTask(tasks, { title: 'C', quadrant: 'do' }, NOW);
  tasks = toggleComplete(tasks, { id: tasks[0].id }, NOW);
  assert.equal(openCount(tasks, 'do'), 2);
});

test('dueStatus: overdue for an open task with a past due date', () => {
  const [task] = addTask([], { title: 'A', quadrant: 'do', due: '2026-03-01' }, NOW);
  assert.equal(dueStatus(task, NOW), 'overdue');
});

test('dueStatus: today for a due date equal to today', () => {
  const [task] = addTask([], { title: 'A', quadrant: 'do', due: '2026-03-05' }, NOW);
  assert.equal(dueStatus(task, NOW), 'today');
});

test('dueStatus: future for a due date after today', () => {
  const [task] = addTask([], { title: 'A', quadrant: 'do', due: '2026-03-10' }, NOW);
  assert.equal(dueStatus(task, NOW), 'future');
});

test('dueStatus: null when no due date', () => {
  const [task] = addTask([], { title: 'A', quadrant: 'do' }, NOW);
  assert.equal(dueStatus(task, NOW), null);
});

test('dueStatus: null (not overdue) for a completed task with a past due date', () => {
  let tasks = addTask([], { title: 'A', quadrant: 'do', due: '2026-03-01' }, NOW);
  tasks = toggleComplete(tasks, { id: tasks[0].id }, NOW);
  assert.equal(dueStatus(tasks[0], NOW), null);
});
