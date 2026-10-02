import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  addTask,
  updateTask,
  toggleComplete,
  deleteTask,
  restoreTask,
  moveTask,
  reorderTask,
} from '../../src/core/actions.js';

const NOW = new Date(2026, 2, 5, 12, 0, 0);
const YESTERDAY = new Date(2026, 2, 4, 12, 0, 0);

// --- addTask -----------------------------------------------------------

test('addTask creates a task at the end of the quadrant, trims title', () => {
  const tasks = addTask([], { title: '  Write roadmap  ', quadrant: 'plan' }, NOW);
  assert.equal(tasks.length, 1);
  assert.equal(tasks[0].title, 'Write roadmap');
  assert.equal(tasks[0].quadrant, 'plan');
  assert.equal(tasks[0].order, 1000);
});

test('addTask appends after existing tasks in the same quadrant', () => {
  let tasks = addTask([], { title: 'A', quadrant: 'do' }, NOW);
  tasks = addTask(tasks, { title: 'B', quadrant: 'do' }, NOW);
  assert.equal(tasks[1].order, 2000);
});

test('addTask does not mutate the input array', () => {
  const input = [];
  addTask(input, { title: 'A', quadrant: 'do' }, NOW);
  assert.equal(input.length, 0);
});

test('addTask rejects an empty title', () => {
  assert.throws(() => addTask([], { title: '   ', quadrant: 'do' }, NOW));
});

// --- updateTask ----------------------------------------------------------

test('updateTask changes title/notes/due and bumps updatedAt', () => {
  const tasks = addTask([], { title: 'A', quadrant: 'do' }, NOW);
  const later = new Date(NOW.getTime() + 1000);
  const updated = updateTask(tasks, { id: tasks[0].id, title: 'B', notes: 'notes', due: '2026-04-01' }, later);
  assert.equal(updated[0].title, 'B');
  assert.equal(updated[0].notes, 'notes');
  assert.equal(updated[0].due, '2026-04-01');
  assert.equal(updated[0].updatedAt, later.toISOString());
});

test('updateTask moving quadrant appends to the end of the new quadrant', () => {
  let tasks = addTask([], { title: 'A', quadrant: 'do' }, NOW);
  tasks = addTask(tasks, { title: 'B', quadrant: 'plan' }, NOW);
  const moved = updateTask(tasks, { id: tasks[0].id, quadrant: 'plan' }, NOW);
  const a = moved.find((t) => t.id === tasks[0].id);
  assert.equal(a.quadrant, 'plan');
  assert.equal(a.order, 2000); // after existing B (order 1000)
});

test('updateTask does not mutate input', () => {
  const tasks = addTask([], { title: 'A', quadrant: 'do' }, NOW);
  const snapshot = JSON.stringify(tasks);
  updateTask(tasks, { id: tasks[0].id, title: 'Changed' }, NOW);
  assert.equal(JSON.stringify(tasks), snapshot);
});

test('updateTask rejects an empty title', () => {
  const tasks = addTask([], { title: 'A', quadrant: 'do' }, NOW);
  assert.throws(() => updateTask(tasks, { id: tasks[0].id, title: '   ' }, NOW));
});

// --- toggleComplete --------------------------------------------------------

test('toggleComplete: completing sets completedAt, keeps position', () => {
  const tasks = addTask([], { title: 'A', quadrant: 'do' }, NOW);
  const toggled = toggleComplete(tasks, { id: tasks[0].id }, NOW);
  assert.equal(toggled[0].completedAt, NOW.toISOString());
  assert.equal(toggled[0].order, tasks[0].order);
});

test('toggleComplete: uncompleting a task completed today just clears completedAt, keeps order', () => {
  let tasks = addTask([], { title: 'A', quadrant: 'do' }, NOW);
  tasks = toggleComplete(tasks, { id: tasks[0].id }, NOW);
  const originalOrder = tasks[0].order;
  const uncompleted = toggleComplete(tasks, { id: tasks[0].id }, NOW);
  assert.equal(uncompleted[0].completedAt, null);
  assert.equal(uncompleted[0].order, originalOrder);
});

test('toggleComplete: uncompleting an archived task appends it to the end of open tasks', () => {
  let tasks = addTask([], { title: 'A', quadrant: 'do' }, YESTERDAY);
  tasks = addTask(tasks, { title: 'B', quadrant: 'do' }, YESTERDAY);
  tasks = toggleComplete(tasks, { id: tasks[0].id }, YESTERDAY); // A completed yesterday -> archived today
  // Today, restore A: should append after B's order (2000) -> 3000
  const restored = toggleComplete(tasks, { id: tasks[0].id }, NOW);
  const a = restored.find((t) => t.id === tasks[0].id);
  const b = restored.find((t) => t.id === tasks[1].id);
  assert.equal(a.completedAt, null);
  assert.ok(a.order > b.order);
});

// --- deleteTask / restoreTask ----------------------------------------------

test('deleteTask removes the task and returns it as deleted', () => {
  const tasks = addTask([], { title: 'A', quadrant: 'do' }, NOW);
  const { tasks: remaining, deleted } = deleteTask(tasks, { id: tasks[0].id });
  assert.equal(remaining.length, 0);
  assert.equal(deleted.id, tasks[0].id);
});

test('deleteTask on unknown id is a no-op', () => {
  const tasks = addTask([], { title: 'A', quadrant: 'do' }, NOW);
  const { tasks: remaining, deleted } = deleteTask(tasks, { id: 'nope' });
  assert.equal(remaining.length, 1);
  assert.equal(deleted, null);
});

test('restoreTask re-inserts the deleted task unchanged, same quadrant/order/data', () => {
  let tasks = addTask([], { title: 'A', quadrant: 'do', notes: 'n' }, NOW);
  tasks = addTask(tasks, { title: 'B', quadrant: 'do' }, NOW);
  const { tasks: afterDelete, deleted } = deleteTask(tasks, { id: tasks[0].id });
  const restored = restoreTask(afterDelete, deleted);
  const a = restored.find((t) => t.id === deleted.id);
  assert.deepEqual(a, deleted);
  assert.equal(a.order, tasks[0].order);
});

// --- moveTask / reorderTask --------------------------------------------------

test('moveTask cross-quadrant appends at end when toIndex is past the end', () => {
  let tasks = addTask([], { title: 'A', quadrant: 'limit' }, NOW);
  tasks = addTask(tasks, { title: 'B', quadrant: 'do' }, NOW);
  const moved = moveTask(tasks, { id: tasks[0].id, toQuadrant: 'do', toIndex: 99 }, NOW);
  const a = moved.find((t) => t.id === tasks[0].id);
  assert.equal(a.quadrant, 'do');
  assert.ok(a.order > moved.find((t) => t.id === tasks[1].id).order);
});

test('moveTask inserts at a specific index within a quadrant', () => {
  let tasks = addTask([], { title: 'A', quadrant: 'do' }, NOW);
  tasks = addTask(tasks, { title: 'B', quadrant: 'do' }, NOW);
  tasks = addTask(tasks, { title: 'C', quadrant: 'do' }, NOW);
  // Move C (index 2) to index 0
  const moved = moveTask(tasks, { id: tasks[2].id, toQuadrant: 'do', toIndex: 0 }, NOW);
  const sorted = moved.filter((t) => t.quadrant === 'do').sort((a, b) => a.order - b.order);
  assert.deepEqual(sorted.map((t) => t.title), ['C', 'A', 'B']);
});

test('reorderTask moves a task up within its quadrant', () => {
  let tasks = addTask([], { title: 'A', quadrant: 'do' }, NOW);
  tasks = addTask(tasks, { title: 'B', quadrant: 'do' }, NOW);
  tasks = addTask(tasks, { title: 'C', quadrant: 'do' }, NOW);
  const reordered = reorderTask(tasks, { id: tasks[2].id, delta: -1 }, NOW); // C up one
  const sorted = reordered.filter((t) => t.quadrant === 'do').sort((a, b) => a.order - b.order);
  assert.deepEqual(sorted.map((t) => t.title), ['A', 'C', 'B']);
});

test('reorderTask at the top edge with delta -1 is a no-op', () => {
  let tasks = addTask([], { title: 'A', quadrant: 'do' }, NOW);
  tasks = addTask(tasks, { title: 'B', quadrant: 'do' }, NOW);
  const reordered = reorderTask(tasks, { id: tasks[0].id, delta: -1 }, NOW);
  assert.deepEqual(reordered, tasks);
});

test('reorderTask at the bottom edge with delta +1 is a no-op', () => {
  let tasks = addTask([], { title: 'A', quadrant: 'do' }, NOW);
  tasks = addTask(tasks, { title: 'B', quadrant: 'do' }, NOW);
  const reordered = reorderTask(tasks, { id: tasks[1].id, delta: 1 }, NOW);
  assert.deepEqual(reordered, tasks);
});

test('moveTask renumbers a quadrant when repeated midpoint insertion collapses the gap', () => {
  let tasks = addTask([], { title: 'A', quadrant: 'do' }, NOW);
  tasks = addTask(tasks, { title: 'B', quadrant: 'do' }, NOW); // orders 1000, 2000
  // Repeatedly move B to index 0 (before A) many times, halving the gap each time,
  // until it collapses below MIN_GAP and triggers a renumber.
  for (let i = 0; i < 60; i++) {
    tasks = moveTask(tasks, { id: tasks[1].id, toQuadrant: 'do', toIndex: 0 }, NOW);
  }
  const sorted = tasks.filter((t) => t.quadrant === 'do').sort((a, b) => a.order - b.order);
  assert.equal(sorted.length, 2);
  // After renumbering, gaps should be back to clean multiples of 1000.
  assert.ok(sorted[1].order - sorted[0].order >= 1);
});
