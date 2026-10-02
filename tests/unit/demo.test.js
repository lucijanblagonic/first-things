import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDemoTasks } from '../../src/core/demo.js';
import { validate, CURRENT_VERSION } from '../../src/core/schema.js';
import { dueStatus } from '../../src/core/selectors.js';

const NOW = new Date(2026, 9, 2, 12, 0, 0); // 2 October 2026, local

test('demo tasks form a valid document with unique ids', () => {
  const tasks = createDemoTasks(NOW);
  assert.equal(tasks.length, 3);
  assert.ok(validate({ version: CURRENT_VERSION, tasks }));
  assert.equal(new Set(tasks.map((t) => t.id)).size, 3);
});

test('demo tasks are spread over quadrants and show an overdue and a future date', () => {
  const tasks = createDemoTasks(NOW);
  assert.deepEqual(
    tasks.map((t) => t.quadrant),
    ['do', 'plan', 'drop'],
  );
  assert.equal(tasks[0].due, '2026-10-01');
  assert.equal(dueStatus(tasks[0], NOW), 'overdue');
  assert.equal(tasks[1].due, '2026-10-09');
  assert.equal(dueStatus(tasks[1], NOW), 'future');
  assert.equal(tasks[2].due, null);
  assert.ok(tasks.every((t) => t.notes.length > 0 && t.completedAt === null));
});

test('demo due dates are relative to the given day, across a month boundary', () => {
  const tasks = createDemoTasks(new Date(2026, 2, 1, 9, 0, 0)); // 1 March 2026
  assert.equal(tasks[0].due, '2026-02-28');
  assert.equal(tasks[1].due, '2026-03-08');
});
