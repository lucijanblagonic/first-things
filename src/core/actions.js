/**
 * Pure action functions over the task list. None of these mutate their input;
 * each returns a new array (or, where noted, an object wrapping one).
 * @typedef {import('./task.js').Task} Task
 */

import { createTask, validateTitle, MAX_NOTES } from './task.js';

const ORDER_STEP = 1000;
const MIN_GAP = 1e-6;

/**
 * @param {Task[]} tasks
 * @param {string} quadrant
 * @returns {Task[]} tasks in `quadrant`, sorted by order ascending
 */
function quadrantTasksByOrder(tasks, quadrant) {
  return tasks.filter((t) => t.quadrant === quadrant).sort((a, b) => a.order - b.order);
}

/**
 * Order value that appends to the end of a quadrant's list.
 * @param {Task[]} tasks
 * @param {string} quadrant
 * @returns {number}
 */
function appendOrder(tasks, quadrant) {
  const inQuadrant = tasks.filter((t) => t.quadrant === quadrant);
  if (inQuadrant.length === 0) return ORDER_STEP;
  return Math.max(...inQuadrant.map((t) => t.order)) + ORDER_STEP;
}

/**
 * Order value to insert at `toIndex` (0-based) among a quadrant's ordered tasks,
 * excluding `excludeId` (the task being moved, if already in that quadrant).
 * Returns `{ order, renumbered }` where `renumbered`, if present, is the full
 * updated ordering for that quadrant (id -> order) to apply when the gap collapses.
 * @param {Task[]} tasks
 * @param {string} quadrant
 * @param {number} toIndex
 * @param {string | null} excludeId
 * @returns {{ order: number, renumbered: Map<string, number> | null }}
 */
function insertOrder(tasks, quadrant, toIndex, excludeId) {
  const siblings = quadrantTasksByOrder(tasks, quadrant).filter((t) => t.id !== excludeId);
  const index = Math.max(0, Math.min(toIndex, siblings.length));

  if (siblings.length === 0) {
    return { order: ORDER_STEP, renumbered: null };
  }
  if (index === siblings.length) {
    return { order: siblings[siblings.length - 1].order + ORDER_STEP, renumbered: null };
  }
  if (index === 0) {
    const gap = siblings[0].order;
    if (gap / 2 < MIN_GAP) {
      return renumberWithInsertAt(siblings, 0);
    }
    return { order: gap / 2, renumbered: null };
  }

  const before = siblings[index - 1];
  const after = siblings[index];
  const gap = after.order - before.order;
  if (gap < MIN_GAP) {
    return renumberWithInsertAt(siblings, index);
  }
  return { order: before.order + gap / 2, renumbered: null };
}

/**
 * Builds a fresh 1000, 2000, … ordering for `siblings` with a new slot opened
 * at `index` for the incoming task, and returns the order assigned to that slot.
 * @param {Task[]} siblings
 * @param {number} index
 * @returns {{ order: number, renumbered: Map<string, number> }}
 */
function renumberWithInsertAt(siblings, index) {
  const withGap = [...siblings.slice(0, index), null, ...siblings.slice(index)];
  const map = new Map();
  let insertedOrder = ORDER_STEP;
  withGap.forEach((task, i) => {
    const order = (i + 1) * ORDER_STEP;
    if (task) {
      map.set(task.id, order);
    } else {
      insertedOrder = order;
    }
  });
  return { order: insertedOrder, renumbered: map };
}

/**
 * @param {Task[]} tasks
 * @param {{ title: string, quadrant: string, notes?: string, due?: string | null }} payload
 * @param {Date} now
 * @returns {Task[]}
 */
export function addTask(tasks, payload, now) {
  const order = appendOrder(tasks, payload.quadrant);
  const task = createTask({ ...payload, order }, now);
  return [...tasks, task];
}

/**
 * @param {Task[]} tasks
 * @param {{ id: string, title?: string, notes?: string, due?: string | null, quadrant?: string }} payload
 * @param {Date} now
 * @returns {Task[]}
 */
export function updateTask(tasks, payload, now) {
  const { id } = payload;
  const existing = tasks.find((t) => t.id === id);
  if (!existing) return tasks;

  /** @type {Partial<Task>} */
  const changes = { updatedAt: now.toISOString() };

  if (payload.title !== undefined) {
    const result = validateTitle(payload.title);
    if (!result.ok) throw new Error(result.error);
    changes.title = result.value;
  }
  if (payload.notes !== undefined) {
    changes.notes = payload.notes.slice(0, MAX_NOTES);
  }
  if (payload.due !== undefined) {
    changes.due = payload.due || null;
  }

  const movingQuadrant = payload.quadrant !== undefined && payload.quadrant !== existing.quadrant;
  if (movingQuadrant) {
    changes.quadrant = payload.quadrant;
    changes.order = appendOrder(tasks, payload.quadrant);
  }

  return tasks.map((t) => (t.id === id ? { ...t, ...changes } : t));
}

/**
 * @param {Task[]} tasks
 * @param {{ id: string }} payload
 * @param {Date} now
 * @returns {Task[]}
 */
export function toggleComplete(tasks, payload, now) {
  const existing = tasks.find((t) => t.id === payload.id);
  if (!existing) return tasks;

  const wasCompleted = existing.completedAt !== null;
  const iso = now.toISOString();

  if (wasCompleted) {
    // Uncompleting: was this an archived (i.e. completed on an earlier day) task?
    const completedDate = existing.completedAt.slice(0, 10);
    const todayDate = iso.slice(0, 10);
    const wasArchived = completedDate < todayDate;
    /** @type {Partial<Task>} */
    const changes = { completedAt: null, updatedAt: iso };
    if (wasArchived) {
      changes.order = appendOrder(tasks, existing.quadrant);
    }
    return tasks.map((t) => (t.id === payload.id ? { ...t, ...changes } : t));
  }

  return tasks.map((t) => (t.id === payload.id ? { ...t, completedAt: iso, updatedAt: iso } : t));
}

/**
 * @param {Task[]} tasks
 * @param {{ id: string }} payload
 * @returns {{ tasks: Task[], deleted: Task | null }}
 */
export function deleteTask(tasks, payload) {
  const deleted = tasks.find((t) => t.id === payload.id) ?? null;
  if (!deleted) return { tasks, deleted: null };
  return { tasks: tasks.filter((t) => t.id !== payload.id), deleted };
}

/**
 * @param {Task[]} tasks
 * @param {Task} deletedTask
 * @returns {Task[]}
 */
export function restoreTask(tasks, deletedTask) {
  if (!deletedTask) return tasks;
  return [...tasks, deletedTask];
}

/**
 * @param {Task[]} tasks
 * @param {{ id: string, toQuadrant: string, toIndex: number }} payload
 * @param {Date} now
 * @returns {Task[]}
 */
export function moveTask(tasks, payload, now) {
  const { id, toQuadrant, toIndex } = payload;
  const existing = tasks.find((t) => t.id === id);
  if (!existing) return tasks;

  const { order, renumbered } = insertOrder(tasks, toQuadrant, toIndex, id);
  const iso = now.toISOString();

  const next = tasks.map((t) => {
    if (t.id === id) {
      return { ...t, quadrant: toQuadrant, order, updatedAt: iso };
    }
    if (renumbered && renumbered.has(t.id)) {
      return { ...t, order: /** @type {number} */ (renumbered.get(t.id)) };
    }
    return t;
  });

  return next;
}

/**
 * Move a task up (delta = -1) or down (delta = +1) within its quadrant.
 * @param {Task[]} tasks
 * @param {{ id: string, delta: number }} payload
 * @param {Date} now
 * @returns {Task[]}
 */
export function reorderTask(tasks, payload, now) {
  const { id, delta } = payload;
  const existing = tasks.find((t) => t.id === id);
  if (!existing) return tasks;

  const siblings = quadrantTasksByOrder(tasks, existing.quadrant);
  const currentIndex = siblings.findIndex((t) => t.id === id);
  const targetIndex = currentIndex + delta;
  if (targetIndex < 0 || targetIndex >= siblings.length) return tasks;

  return moveTask(tasks, { id, toQuadrant: existing.quadrant, toIndex: targetIndex }, now);
}
