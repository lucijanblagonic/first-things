/**
 * Derived, read-only views over the task list. Nothing here is persisted.
 * @typedef {import('./task.js').Task} Task
 */

import { startOfLocalDay, todayISO, compareISODate } from './dates.js';

/**
 * A task is archived once it was completed strictly before the start of the
 * current local calendar day.
 * @param {Task} task
 * @param {Date} now
 * @returns {boolean}
 */
export function isArchived(task, now) {
  if (!task.completedAt) return false;
  return new Date(task.completedAt).getTime() < startOfLocalDay(now).getTime();
}

/**
 * Active (not archived) tasks in a quadrant, sorted by order ascending.
 * Includes open tasks and tasks completed today.
 * @param {Task[]} tasks
 * @param {string} quadrant
 * @param {Date} now
 * @returns {Task[]}
 */
export function activeTasks(tasks, quadrant, now) {
  return tasks
    .filter((t) => t.quadrant === quadrant && !isArchived(t, now))
    .sort((a, b) => a.order - b.order);
}

/**
 * Archived tasks in a quadrant, most recently completed first.
 * @param {Task[]} tasks
 * @param {string} quadrant
 * @param {Date} now
 * @returns {Task[]}
 */
export function archivedTasks(tasks, quadrant, now) {
  return tasks
    .filter((t) => t.quadrant === quadrant && isArchived(t, now))
    .sort((a, b) => new Date(b.completedAt ?? 0).getTime() - new Date(a.completedAt ?? 0).getTime());
}

/**
 * Count of open (not completed) tasks in a quadrant.
 * @param {Task[]} tasks
 * @param {string} quadrant
 * @returns {number}
 */
export function openCount(tasks, quadrant) {
  return tasks.filter((t) => t.quadrant === quadrant && t.completedAt === null).length;
}

/**
 * @param {Task} task
 * @param {Date} now
 * @returns {'overdue' | 'today' | 'future' | null}
 */
export function dueStatus(task, now) {
  if (!task.due) return null;
  if (task.completedAt !== null) return null;
  const today = todayISO(now);
  const cmp = compareISODate(task.due, today);
  if (cmp < 0) return 'overdue';
  if (cmp === 0) return 'today';
  return 'future';
}
