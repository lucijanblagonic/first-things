/**
 * Task model: validation and construction.
 * @typedef {{
 *   id: string, title: string, notes: string, due: string | null,
 *   quadrant: string, order: number,
 *   createdAt: string, updatedAt: string, completedAt: string | null
 * }} Task
 */

export const MAX_TITLE = 200;
export const MAX_NOTES = 5000;

/**
 * @param {string} str
 * @returns {{ ok: true, value: string } | { ok: false, error: string }}
 */
export function validateTitle(str) {
  const value = typeof str === 'string' ? str.trim() : '';
  if (value.length === 0) {
    return { ok: false, error: 'Title is required.' };
  }
  if (value.length > MAX_TITLE) {
    return { ok: false, error: `Title must be ${MAX_TITLE} characters or fewer.` };
  }
  return { ok: true, value };
}

/**
 * @param {{ title: string, quadrant: string, notes?: string, due?: string | null, order: number }} input
 * @param {Date} now
 * @returns {Task}
 */
export function createTask({ title, quadrant, notes = '', due = null, order }, now) {
  const titleResult = validateTitle(title);
  if (!titleResult.ok) {
    throw new Error(titleResult.error);
  }
  const iso = now.toISOString();
  return {
    id: crypto.randomUUID(),
    title: titleResult.value,
    notes: typeof notes === 'string' ? notes.slice(0, MAX_NOTES) : '',
    due: due || null,
    quadrant,
    order,
    createdAt: iso,
    updatedAt: iso,
    completedAt: null,
  };
}
