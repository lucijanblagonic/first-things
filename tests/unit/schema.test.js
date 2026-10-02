import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validate, migrate, parse, CURRENT_VERSION } from '../../src/core/schema.js';

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

test('validate accepts an empty task list', () => {
  assert.equal(validate({ version: 1, tasks: [] }), true);
});

test('validate accepts a well-formed task', () => {
  assert.equal(validate({ version: 1, tasks: [validTask()] }), true);
});

test('validate rejects an unknown quadrant', () => {
  assert.equal(validate({ version: 1, tasks: [validTask({ quadrant: 'nope' })] }), false);
});

test('validate rejects a non-string title', () => {
  assert.equal(validate({ version: 1, tasks: [validTask({ title: 42 })] }), false);
});

test('validate rejects a malformed due date', () => {
  assert.equal(validate({ version: 1, tasks: [validTask({ due: 'not-a-date' })] }), false);
});

test('validate rejects a document with no version', () => {
  assert.equal(validate({ tasks: [] }), false);
});

test('migrate is a no-op at CURRENT_VERSION', () => {
  const doc = { version: CURRENT_VERSION, tasks: [] };
  assert.equal(migrate(doc), doc);
});

test('parse: null raw is treated as empty', () => {
  const result = parse(null);
  assert.equal(result.status, 'empty');
  assert.deepEqual(result.doc.tasks, []);
});

test('parse: invalid JSON is corrupt', () => {
  const result = parse('{not valid json');
  assert.equal(result.status, 'corrupt');
});

test('parse: valid JSON that fails schema validation is corrupt', () => {
  const result = parse(JSON.stringify({ version: 1, tasks: [{ id: 'x' }] }));
  assert.equal(result.status, 'corrupt');
});

test('parse: newer version is flagged without being touched', () => {
  const raw = JSON.stringify({ version: CURRENT_VERSION + 1, tasks: [] });
  const result = parse(raw);
  assert.equal(result.status, 'newer');
});

test('parse: valid current-version document is ok', () => {
  const raw = JSON.stringify({ version: CURRENT_VERSION, tasks: [validTask()] });
  const result = parse(raw);
  assert.equal(result.status, 'ok');
  assert.equal(result.doc.tasks.length, 1);
});
