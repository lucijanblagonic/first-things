/**
 * Local-calendar-day helpers. All "day" logic for archiving and due dates lives here.
 */

/**
 * @param {Date} now
 * @returns {string} local date as YYYY-MM-DD
 */
export function todayISO(now) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * @param {Date} now
 * @returns {Date} midnight (00:00:00.000) of `now`'s local calendar day
 */
export function startOfLocalDay(now) {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
}

/**
 * @param {Date} now
 * @returns {number} milliseconds until the next local midnight after `now`
 */
export function msUntilNextLocalMidnight(now) {
  const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  return nextMidnight.getTime() - now.getTime();
}

/**
 * Lexicographic comparison of two YYYY-MM-DD strings (works because the format is zero-padded).
 * @param {string} a
 * @param {string} b
 * @returns {number} negative if a < b, 0 if equal, positive if a > b
 */
export function compareISODate(a, b) {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}
