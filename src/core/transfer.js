/**
 * Export/import of the task board as text (design D10, D11). The exported
 * text is the persisted document plus a timestamp, so it goes through the
 * same validation and migration as stored data. Pure and DOM-free: the file
 * and clipboard plumbing lives in src/ui/data-transfer.js.
 * @typedef {import('./task.js').Task} Task
 */

import { CURRENT_VERSION, parse } from './schema.js';
import { todayISO } from './dates.js';

// Anything larger could never fit in localStorage, so it is rejected unparsed.
const MAX_IMPORT_LENGTH = 5_000_000;

/**
 * @param {Task[]} tasks
 * @param {Date} now
 * @returns {string} the board as pretty-printed JSON
 */
export function serializeExport(tasks, now) {
  return JSON.stringify({ version: CURRENT_VERSION, exportedAt: now.toISOString(), tasks }, null, 2);
}

/**
 * @param {Date} now
 * @returns {string} suggested file name, dated in local time
 */
export function exportFilename(now) {
  return `decision-matrix-${todayISO(now)}.json`;
}

/**
 * Checks text from a file or the clipboard and extracts its tasks.
 * @param {unknown} raw
 * @returns {{ status: 'ok', tasks: Task[] } | { status: 'invalid' } | { status: 'newer' }}
 */
export function parseImport(raw) {
  if (typeof raw !== 'string' || raw.length > MAX_IMPORT_LENGTH) return { status: 'invalid' };

  const result = parse(raw);
  if (result.status === 'newer') return { status: 'newer' };
  if (result.status !== 'ok') return { status: 'invalid' };

  // validate() does not check uniqueness, and rendering is keyed by id.
  const ids = new Set(result.doc.tasks.map((task) => task.id));
  if (ids.size !== result.doc.tasks.length) return { status: 'invalid' };

  return { status: 'ok', tasks: result.doc.tasks };
}
