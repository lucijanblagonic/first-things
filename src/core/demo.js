/**
 * Example tasks shown the first time the app is opened in a browser, so a new
 * board is not blank and the features (due dates, notes, quadrants) are
 * visible at a glance. They are ordinary tasks: editable, movable, deletable.
 * @typedef {import('./task.js').Task} Task
 */

import { createTask } from './task.js';
import { todayISO } from './dates.js';

const ORDER_STEP = 1000;

/**
 * @param {Date} now
 * @param {number} days whole days to add (negative for the past)
 * @returns {string} local date as YYYY-MM-DD
 */
function daysFromNow(now, days) {
  return todayISO(new Date(now.getFullYear(), now.getMonth(), now.getDate() + days));
}

/**
 * @param {Date} now
 * @returns {Task[]} one overdue task, one with notes and a future date, one plain
 */
export function createDemoTasks(now) {
  return [
    createTask(
      {
        title: 'Pay the electricity bill',
        quadrant: 'do',
        due: daysFromNow(now, -1),
        notes: 'An example task. Tick the box when it is done.',
        order: ORDER_STEP,
      },
      now,
    ),
    createTask(
      {
        title: 'Book a dentist appointment',
        quadrant: 'plan',
        due: daysFromNow(now, 7),
        notes: 'Click a task to edit it, or drag it to another quadrant.',
        order: ORDER_STEP,
      },
      now,
    ),
    createTask(
      {
        title: 'Tidy the bookmarks bar',
        quadrant: 'drop',
        notes: 'These three are examples. Delete them with ✕ whenever you like.',
        order: ORDER_STEP,
      },
      now,
    ),
  ];
}
