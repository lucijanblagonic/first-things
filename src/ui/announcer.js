/**
 * A single polite live region used for all non-obvious action announcements.
 */

let regionEl = null;

/**
 * @param {HTMLElement} el the `aria-live="polite"` element from index.html
 */
export function initAnnouncer(el) {
  regionEl = el;
}

/**
 * Announces `message`. Clears the region first so that repeating the same
 * message back-to-back is still read by screen readers.
 * @param {string} message
 */
export function announce(message) {
  if (!regionEl) return;
  regionEl.textContent = '';
  // Force a reflow so assistive tech treats the next assignment as a change,
  // even when the text is identical to what was there before.
  void regionEl.offsetWidth;
  regionEl.textContent = message;
}
