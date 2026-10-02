import { test } from 'node:test';
import assert from 'node:assert/strict';
import { serializeExport, exportFilename, parseImport } from '../../src/core/transfer.js';
import { CURRENT_VERSION } from '../../src/core/schema.js';

const NOW = new Date(2026, 9, 2, 9, 30, 0); // 2 October 2026, local

function validTask(overrides = {}) {
  return {
    id: 'abc-123',
    title: 'Task',
    notes: '',
    due: null,
    quadrant: 'do',
    order: 1000,
    createdAt: '2026-03-05T00:00:00.000Z',
    updatedAt: '2026-03-05T00:00:00.000Z',
    completedAt: null,
    ...overrides,
  };
}

test('exportFilename contains the app name and the local date', () => {
  assert.equal(exportFilename(NOW), 'decision-matrix-2026-10-02.json');
});

test('serializeExport writes the version, a timestamp and every task', () => {
  const tasks = [validTask(), validTask({ id: 'def-456', quadrant: 'plan', due: '2026-10-09' })];
  const doc = JSON.parse(serializeExport(tasks, NOW));
  assert.equal(doc.version, CURRENT_VERSION);
  assert.equal(doc.exportedAt, NOW.toISOString());
  assert.deepEqual(doc.tasks, tasks);
});

test('round trip: an export imports back to the same tasks', () => {
  const tasks = [
    validTask({ notes: 'Line one\nLine two', completedAt: '2026-03-06T00:00:00.000Z' }),
    validTask({ id: 'def-456', title: 'Other', quadrant: 'drop', order: 2000, due: '2026-10-09' }),
  ];
  assert.deepEqual(parseImport(serializeExport(tasks, NOW)), { status: 'ok', tasks });
});

test('round trip: an empty board', () => {
  assert.deepEqual(parseImport(serializeExport([], NOW)), { status: 'ok', tasks: [] });
});

test('parseImport rejects text that is not JSON', () => {
  assert.deepEqual(parseImport('not json'), { status: 'invalid' });
  assert.deepEqual(parseImport(''), { status: 'invalid' });
});

test('parseImport rejects JSON that is not a board document', () => {
  assert.deepEqual(parseImport('{}'), { status: 'invalid' });
  assert.deepEqual(parseImport('[]'), { status: 'invalid' });
  assert.deepEqual(parseImport('"hello"'), { status: 'invalid' });
});

test('parseImport rejects non-string input', () => {
  assert.deepEqual(parseImport(null), { status: 'invalid' });
  assert.deepEqual(parseImport(undefined), { status: 'invalid' });
});

test('parseImport rejects a task that fails validation', () => {
  const { title, ...withoutTitle } = validTask();
  const raw = JSON.stringify({ version: CURRENT_VERSION, tasks: [withoutTitle] });
  assert.deepEqual(parseImport(raw), { status: 'invalid' });
});

test('parseImport rejects two tasks with the same id', () => {
  const raw = JSON.stringify({ version: CURRENT_VERSION, tasks: [validTask(), validTask({ title: 'Twin' })] });
  assert.deepEqual(parseImport(raw), { status: 'invalid' });
});

test('parseImport reports a document from a newer version', () => {
  assert.deepEqual(parseImport('{"version": 999, "tasks": []}'), { status: 'newer' });
});

test('parseImport rejects oversized text without parsing it', () => {
  assert.deepEqual(parseImport(' '.repeat(5_000_001)), { status: 'invalid' });
});
