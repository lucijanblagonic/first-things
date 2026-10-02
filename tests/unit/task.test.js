import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateTitle, createTask, MAX_NOTES, MAX_TITLE } from '../../src/core/task.js';

test('validateTitle rejects empty string', () => {
  const result = validateTitle('');
  assert.equal(result.ok, false);
});

test('validateTitle rejects whitespace-only string', () => {
  const result = validateTitle('   ');
  assert.equal(result.ok, false);
});

test('validateTitle trims surrounding whitespace', () => {
  const result = validateTitle('  Call Ana  ');
  assert.equal(result.ok, true);
  assert.equal(result.value, 'Call Ana');
});

test('validateTitle accepts a title at the 200 char boundary', () => {
  const title = 'a'.repeat(MAX_TITLE);
  const result = validateTitle(title);
  assert.equal(result.ok, true);
  assert.equal(result.value.length, MAX_TITLE);
});

test('validateTitle rejects a title over 200 chars', () => {
  const title = 'a'.repeat(MAX_TITLE + 1);
  const result = validateTitle(title);
  assert.equal(result.ok, false);
});

test('createTask builds a task with trimmed title, id, timestamps', () => {
  const now = new Date(2026, 2, 5, 10, 0, 0);
  const task = createTask({ title: '  Write roadmap  ', quadrant: 'plan', order: 1000 }, now);
  assert.equal(task.title, 'Write roadmap');
  assert.equal(task.quadrant, 'plan');
  assert.equal(task.order, 1000);
  assert.equal(task.notes, '');
  assert.equal(task.due, null);
  assert.equal(task.completedAt, null);
  assert.equal(typeof task.id, 'string');
  assert.ok(task.id.length > 0);
  assert.equal(task.createdAt, now.toISOString());
  assert.equal(task.updatedAt, now.toISOString());
});

test('createTask throws for an invalid title', () => {
  const now = new Date();
  assert.throws(() => createTask({ title: '   ', quadrant: 'do', order: 1000 }, now));
});

test('createTask truncates notes to MAX_NOTES', () => {
  const now = new Date();
  const longNotes = 'x'.repeat(MAX_NOTES + 100);
  const task = createTask({ title: 'Task', quadrant: 'do', order: 1000, notes: longNotes }, now);
  assert.equal(task.notes.length, MAX_NOTES);
});

test('createTask preserves an explicit due date', () => {
  const now = new Date();
  const task = createTask({ title: 'Task', quadrant: 'do', order: 1000, due: '2026-04-01' }, now);
  assert.equal(task.due, '2026-04-01');
});

test('createTask generates unique ids', () => {
  const now = new Date();
  const a = createTask({ title: 'A', quadrant: 'do', order: 1000 }, now);
  const b = createTask({ title: 'B', quadrant: 'do', order: 2000 }, now);
  assert.notEqual(a.id, b.id);
});
