/**
 * Versioned persisted-document shape, validation and migration.
 * @typedef {import('./task.js').Task} Task
 * @typedef {{ version: number, tasks: Task[] }} Document
 */

import { QUADRANT_IDS } from './quadrants.js';
import { MAX_TITLE, MAX_NOTES } from './task.js';

export const CURRENT_VERSION = 1;

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * @param {unknown} value
 * @returns {value is string}
 */
function isNonEmptyString(value) {
  return typeof value === 'string' && value.length > 0;
}

/**
 * @param {unknown} task
 * @returns {boolean}
 */
function isValidTask(task) {
  if (typeof task !== 'object' || task === null) return false;
  const t = /** @type {Record<string, unknown>} */ (task);

  if (!isNonEmptyString(t.id)) return false;
  if (typeof t.title !== 'string' || t.title.length < 1 || t.title.length > MAX_TITLE) return false;
  if (typeof t.notes !== 'string' || t.notes.length > MAX_NOTES) return false;
  if (t.due !== null && !(typeof t.due === 'string' && ISO_DATE_RE.test(t.due))) return false;
  if (typeof t.quadrant !== 'string' || !QUADRANT_IDS.includes(t.quadrant)) return false;
  if (typeof t.order !== 'number' || !Number.isFinite(t.order)) return false;
  if (!isNonEmptyString(t.createdAt)) return false;
  if (!isNonEmptyString(t.updatedAt)) return false;
  if (t.completedAt !== null && !isNonEmptyString(t.completedAt)) return false;

  return true;
}

/**
 * @param {unknown} doc
 * @returns {doc is Document}
 */
export function validate(doc) {
  if (typeof doc !== 'object' || doc === null) return false;
  const d = /** @type {Record<string, unknown>} */ (doc);
  if (typeof d.version !== 'number') return false;
  if (!Array.isArray(d.tasks)) return false;
  return d.tasks.every(isValidTask);
}

/**
 * Migrates an older, valid document up to CURRENT_VERSION. The POC has only
 * version 1, so this is currently the identity function for version 1 docs.
 * @param {Document} doc
 * @returns {Document}
 */
export function migrate(doc) {
  if (doc.version === CURRENT_VERSION) return doc;
  // No prior versions exist yet; unknown older versions pass through unchanged.
  return doc;
}

/**
 * @param {string | null} raw
 * @returns {{ status: 'ok', doc: Document } | { status: 'empty', doc: Document } | { status: 'corrupt', doc: null } | { status: 'newer', doc: Document }}
 */
export function parse(raw) {
  if (raw === null || raw === undefined) {
    return { status: 'empty', doc: { version: CURRENT_VERSION, tasks: [] } };
  }

  /** @type {unknown} */
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { status: 'corrupt', doc: null };
  }

  if (typeof parsed !== 'object' || parsed === null || typeof (/** @type {any} */ (parsed).version) !== 'number') {
    return { status: 'corrupt', doc: null };
  }

  const version = /** @type {any} */ (parsed).version;
  if (version > CURRENT_VERSION) {
    return { status: 'newer', doc: /** @type {Document} */ (parsed) };
  }

  if (!validate(parsed)) {
    return { status: 'corrupt', doc: null };
  }

  const migrated = migrate(/** @type {Document} */ (parsed));
  return { status: 'ok', doc: migrated };
}
