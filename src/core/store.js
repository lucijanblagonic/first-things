/**
 * The single state store: holds task state, runs actions, persists through an
 * adapter, and exposes a single-slot undo for deletions.
 * @typedef {import('./task.js').Task} Task
 * @typedef {import('./storage/adapter.js').StorageAdapter} StorageAdapter
 */

import * as actions from './actions.js';
import { parse, CURRENT_VERSION } from './schema.js';

const UNDO_WINDOW_MS = 5000;

const ACTION_HANDLERS = {
  addTask: actions.addTask,
  updateTask: actions.updateTask,
  toggleComplete: actions.toggleComplete,
  moveTask: actions.moveTask,
  reorderTask: actions.reorderTask,
};

/**
 * @param {{
 *   adapter: StorageAdapter,
 *   now?: () => Date,
 *   timers?: { setTimeout: typeof setTimeout, clearTimeout: typeof clearTimeout },
 * }} options
 */
const defaultTimers = {
  setTimeout: (...args) => setTimeout(...args),
  clearTimeout: (...args) => clearTimeout(...args),
};

export function createStore({ adapter, now = () => new Date(), timers = defaultTimers }) {
  /** @type {{ tasks: Task[] }} */
  const state = { tasks: [] };
  /** @type {'ok' | 'unavailable' | 'newer-version'} */
  let status = 'ok';
  /** @type {string | null} */
  let notice = null;
  /** @type {{ task: Task } | null} */
  let lastDeleted = null;
  /** @type {ReturnType<typeof setTimeout> | null} */
  let undoTimer = null;

  const listeners = new Set();
  let saving = false;
  let pendingSave = false;

  function notify() {
    for (const listener of listeners) listener();
  }

  function clearUndo() {
    lastDeleted = null;
    if (undoTimer !== null) {
      timers.clearTimeout(undoTimer);
      undoTimer = null;
    }
  }

  async function runSaveLoop() {
    if (saving) return;
    saving = true;
    while (pendingSave) {
      pendingSave = false;
      if (status === 'newer-version') break;
      const snapshot = JSON.stringify({ version: CURRENT_VERSION, tasks: state.tasks });
      try {
        await adapter.save(snapshot);
        if (status === 'unavailable') {
          status = 'ok';
          notice = null;
          notify();
        }
      } catch {
        status = 'unavailable';
        notice = 'localStorage is unavailable; your changes are not being saved.';
        notify();
      }
    }
    saving = false;
  }

  function scheduleSave() {
    if (status === 'newer-version') return;
    pendingSave = true;
    runSaveLoop();
  }

  return {
    async init() {
      if (adapter.isAvailable && !adapter.isAvailable()) {
        state.tasks = [];
        status = 'unavailable';
        notice = 'localStorage is unavailable; your changes will not be saved.';
        notify();
        return;
      }

      const raw = await adapter.load();
      const result = parse(raw);

      if (result.status === 'ok' || result.status === 'empty') {
        state.tasks = result.doc.tasks;
        status = 'ok';
        notice = null;
      } else if (result.status === 'corrupt') {
        if (raw !== null && adapter.backup) {
          await adapter.backup(raw);
        }
        state.tasks = [];
        status = 'ok';
        notice = 'Saved data could not be read. A backup was kept and the board started empty.';
        scheduleSave();
      } else if (result.status === 'newer') {
        state.tasks = result.doc.tasks || [];
        status = 'newer-version';
        notice = 'This data was created by a newer version of the app. Changes here will not be saved.';
      }

      notify();
    },

    getState() {
      return { tasks: state.tasks, status, notice };
    },

    canUndo() {
      return lastDeleted !== null;
    },

    /** @returns {Task | null} the task that would be restored by undoDelete(), without consuming it */
    peekUndo() {
      return lastDeleted ? lastDeleted.task : null;
    },

    /**
     * @param {keyof typeof ACTION_HANDLERS | 'deleteTask'} actionName
     * @param {any} payload
     * @returns {Task | undefined} the deleted task, for `deleteTask`; otherwise undefined
     */
    dispatch(actionName, payload) {
      if (actionName === 'deleteTask') {
        const { tasks, deleted } = actions.deleteTask(state.tasks, payload);
        if (!deleted) return undefined;
        state.tasks = tasks;
        clearUndo();
        lastDeleted = { task: deleted };
        undoTimer = timers.setTimeout(() => {
          lastDeleted = null;
          undoTimer = null;
        }, UNDO_WINDOW_MS);
        notify();
        scheduleSave();
        return deleted;
      }

      const handler = ACTION_HANDLERS[actionName];
      if (!handler) {
        throw new Error(`Unknown action: ${actionName}`);
      }
      state.tasks = handler(state.tasks, payload, now());
      notify();
      scheduleSave();
      return undefined;
    },

    undoDelete() {
      if (!lastDeleted) return;
      const { task } = lastDeleted;
      clearUndo();
      state.tasks = actions.restoreTask(state.tasks, task);
      notify();
      scheduleSave();
    },

    /**
     * Replaces every task at once (import). The previous board is handed to
     * the adapter's backup first. Refused while the stored data is from a
     * newer version, since saving over it is not allowed.
     * @param {Task[]} tasks
     * @returns {Promise<boolean>} false if the replacement was refused
     */
    async replaceAll(tasks) {
      if (status === 'newer-version') return false;
      if (adapter.backup && state.tasks.length > 0) {
        await adapter.backup(JSON.stringify({ version: CURRENT_VERSION, tasks: state.tasks }));
      }
      clearUndo();
      state.tasks = tasks;
      notify();
      scheduleSave();
      return true;
    },

    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },

    async reloadFromAdapter() {
      const raw = await adapter.load();
      const result = parse(raw);
      if (result.status === 'ok' || result.status === 'empty') {
        state.tasks = result.doc.tasks;
        notify();
      }
    },
  };
}
