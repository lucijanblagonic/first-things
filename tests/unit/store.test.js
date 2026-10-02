import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore } from '../../src/core/store.js';
import { createMemoryAdapter } from '../../src/core/storage/memory.js';

const NOW = () => new Date(2026, 2, 5, 12, 0, 0);

/** A fake timer whose callbacks fire only when `advance()` is called. */
function createFakeTimers() {
  let nextId = 1;
  const pending = new Map();
  return {
    setTimeout(cb) {
      const id = nextId++;
      pending.set(id, cb);
      return id;
    },
    clearTimeout(id) {
      pending.delete(id);
    },
    fireAll() {
      for (const [id, cb] of pending) {
        pending.delete(id);
        cb();
      }
    },
  };
}

test('persistence round-trip: state saved by one store is loaded by another', async () => {
  const adapter = createMemoryAdapter();
  const storeA = createStore({ adapter, now: NOW });
  await storeA.init();
  storeA.dispatch('addTask', { title: 'Write roadmap', quadrant: 'plan' });
  // allow the async save loop to flush
  await new Promise((r) => setTimeout(r, 0));

  const storeB = createStore({ adapter, now: NOW });
  await storeB.init();
  assert.equal(storeB.getState().tasks.length, 1);
  assert.equal(storeB.getState().tasks[0].title, 'Write roadmap');
});

test('corrupt JSON: backs up, starts empty, sets a notice', async () => {
  const adapter = createMemoryAdapter();
  let backedUp = null;
  const originalBackup = adapter.backup.bind(adapter);
  adapter.backup = async (raw) => {
    backedUp = raw;
    return originalBackup(raw);
  };
  // seed corrupt data directly
  await adapter.save('{not valid json');
  // memory adapter's save just stores it raw regardless of validity

  const store = createStore({ adapter, now: NOW });
  await store.init();

  assert.equal(backedUp, '{not valid json');
  assert.deepEqual(store.getState().tasks, []);
  assert.equal(store.getState().status, 'ok');
  assert.ok(store.getState().notice && store.getState().notice.includes('backup'));
});

test('newer version present: state is read-only, no saves happen', async () => {
  const adapter = createMemoryAdapter();
  const newerDoc = JSON.stringify({ version: 999, tasks: [] });
  await adapter.save(newerDoc);

  const store = createStore({ adapter, now: NOW });
  await store.init();
  assert.equal(store.getState().status, 'newer-version');

  store.dispatch('addTask', { title: 'Should not save', quadrant: 'do' });
  await new Promise((r) => setTimeout(r, 0));

  // The underlying storage must be untouched.
  assert.equal(await adapter.load(), newerDoc);
});

test('failing save: status becomes unavailable but state still updates', async () => {
  const adapter = createMemoryAdapter({ throwOnSave: true });
  const store = createStore({ adapter, now: NOW });
  await store.init();

  store.dispatch('addTask', { title: 'A', quadrant: 'do' });
  await new Promise((r) => setTimeout(r, 0));

  assert.equal(store.getState().tasks.length, 1);
  assert.equal(store.getState().status, 'unavailable');
  assert.ok(store.getState().notice);
});

test('undo: restores the deleted task within the window', async () => {
  const adapter = createMemoryAdapter();
  const timers = createFakeTimers();
  const store = createStore({ adapter, now: NOW, timers });
  await store.init();
  store.dispatch('addTask', { title: 'A', quadrant: 'do' });
  const id = store.getState().tasks[0].id;

  store.dispatch('deleteTask', { id });
  assert.equal(store.getState().tasks.length, 0);
  assert.equal(store.canUndo(), true);

  store.undoDelete();
  assert.equal(store.getState().tasks.length, 1);
  assert.equal(store.getState().tasks[0].id, id);
  assert.equal(store.canUndo(), false);
});

test('undo: expires after the timer fires', async () => {
  const adapter = createMemoryAdapter();
  const timers = createFakeTimers();
  const store = createStore({ adapter, now: NOW, timers });
  await store.init();
  store.dispatch('addTask', { title: 'A', quadrant: 'do' });
  const id = store.getState().tasks[0].id;

  store.dispatch('deleteTask', { id });
  assert.equal(store.canUndo(), true);

  timers.fireAll();
  assert.equal(store.canUndo(), false);
  store.undoDelete(); // no-op now
  assert.equal(store.getState().tasks.length, 0);
});

test('undo: a second delete clears the first undo slot', async () => {
  const adapter = createMemoryAdapter();
  const timers = createFakeTimers();
  const store = createStore({ adapter, now: NOW, timers });
  await store.init();
  store.dispatch('addTask', { title: 'A', quadrant: 'do' });
  store.dispatch('addTask', { title: 'B', quadrant: 'do' });
  const [a, b] = store.getState().tasks;

  store.dispatch('deleteTask', { id: a.id });
  store.dispatch('deleteTask', { id: b.id });

  store.undoDelete();
  const titles = store.getState().tasks.map((t) => t.title);
  assert.deepEqual(titles, ['B']);
});

/** A memory adapter that records what it was asked to back up. */
function createRecordingAdapter() {
  const adapter = createMemoryAdapter();
  /** @type {string[]} */
  const backups = [];
  return {
    ...adapter,
    async backup(raw) {
      backups.push(raw);
    },
    backups,
  };
}

function importedTask(overrides = {}) {
  return {
    id: 'imported-1',
    title: 'Imported',
    notes: '',
    due: null,
    quadrant: 'plan',
    order: 1000,
    createdAt: '2026-03-05T00:00:00.000Z',
    updatedAt: '2026-03-05T00:00:00.000Z',
    completedAt: null,
    ...overrides,
  };
}

test('replaceAll: swaps the tasks, notifies and saves only the new ones', async () => {
  const adapter = createRecordingAdapter();
  const store = createStore({ adapter, now: NOW });
  await store.init();
  store.dispatch('addTask', { title: 'Old task', quadrant: 'do' });
  await new Promise((r) => setTimeout(r, 0));

  let notified = 0;
  store.subscribe(() => notified++);
  const tasks = [importedTask(), importedTask({ id: 'imported-2', title: 'Second' })];
  assert.equal(await store.replaceAll(tasks), true);
  await new Promise((r) => setTimeout(r, 0));

  assert.deepEqual(store.getState().tasks, tasks);
  assert.ok(notified >= 1);
  assert.deepEqual(JSON.parse(/** @type {string} */ (await adapter.load())).tasks, tasks);
});

test('replaceAll: backs up the previous board when it had tasks', async () => {
  const adapter = createRecordingAdapter();
  const store = createStore({ adapter, now: NOW });
  await store.init();
  store.dispatch('addTask', { title: 'Old task', quadrant: 'do' });

  await store.replaceAll([importedTask()]);

  assert.equal(adapter.backups.length, 1);
  const backedUp = JSON.parse(adapter.backups[0]);
  assert.equal(backedUp.tasks.length, 1);
  assert.equal(backedUp.tasks[0].title, 'Old task');
});

test('replaceAll: does not back up an empty board', async () => {
  const adapter = createRecordingAdapter();
  const store = createStore({ adapter, now: NOW });
  await store.init();

  await store.replaceAll([importedTask()]);

  assert.equal(adapter.backups.length, 0);
});

test('replaceAll: clears a pending undo', async () => {
  const adapter = createRecordingAdapter();
  const timers = createFakeTimers();
  const store = createStore({ adapter, now: NOW, timers });
  await store.init();
  store.dispatch('addTask', { title: 'Soon deleted', quadrant: 'do' });
  store.dispatch('deleteTask', { id: store.getState().tasks[0].id });
  assert.equal(store.canUndo(), true);

  await store.replaceAll([importedTask()]);

  assert.equal(store.canUndo(), false);
});

test('replaceAll: refused when stored data is from a newer version', async () => {
  const adapter = createRecordingAdapter();
  const newerDoc = JSON.stringify({ version: 999, tasks: [] });
  await adapter.save(newerDoc);
  const store = createStore({ adapter, now: NOW });
  await store.init();

  assert.equal(await store.replaceAll([importedTask()]), false);
  await new Promise((r) => setTimeout(r, 0));

  assert.deepEqual(store.getState().tasks, []);
  assert.equal(await adapter.load(), newerDoc);
  assert.equal(adapter.backups.length, 0);
});
