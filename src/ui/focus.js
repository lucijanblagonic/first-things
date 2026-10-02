/**
 * Roving-tabindex focus model for the board (design D6): each task list has
 * exactly one tab stop (the focused, or last-focused, task); arrow keys move
 * between tasks. Because `render.js` fully rebuilds each `<ul>`'s children on
 * every state change, focus is tracked by task id and re-applied to whichever
 * DOM node currently represents that id — not by holding element references.
 */

import { QUADRANTS } from '../core/quadrants.js';

/**
 * @param {string} taskId
 * @returns {HTMLLIElement | null}
 */
function findTaskEl(taskId) {
  return /** @type {HTMLLIElement | null} */ (
    document.querySelector(`li[data-id="${CSS.escape(taskId)}"]`)
  );
}

/**
 * @param {string} quadrantId
 * @returns {HTMLLIElement[]}
 */
function activeItemsIn(quadrantId) {
  const listEl = document.getElementById(`${quadrantId}-list`);
  return listEl ? Array.from(listEl.querySelectorAll('li[data-id]')) : [];
}

export function createFocusController() {
  /** @type {string | null} the task id that currently "owns" focus, if any */
  let focusedTaskId = null;
  /** @type {Map<string, string>} quadrant id -> last-focused task id in it */
  const lastFocusedByQuadrant = new Map();

  function updateAllRovingTabindex() {
    for (const quadrant of QUADRANTS) {
      const items = activeItemsIn(quadrant.id);
      if (items.length === 0) continue;
      const remembered = lastFocusedByQuadrant.get(quadrant.id);
      const current =
        items.find((li) => li.dataset.id === focusedTaskId) ??
        items.find((li) => li.dataset.id === remembered) ??
        items[0];
      for (const li of items) {
        li.tabIndex = li === current ? 0 : -1;
      }
    }
  }

  /**
   * @param {string} id
   * @returns {boolean} whether the task was found and focused
   */
  function focusTask(id) {
    const li = findTaskEl(id);
    if (!li) return false;
    focusedTaskId = id;
    const quadrantId = li.closest('.quadrant')?.getAttribute('data-quadrant');
    if (quadrantId) lastFocusedByQuadrant.set(quadrantId, id);
    updateAllRovingTabindex();
    li.focus();
    return true;
  }

  /**
   * Focuses the quadrant's remembered task, its first active task, or its
   * add control if it has none.
   * @param {string} quadrantId
   */
  function focusQuadrant(quadrantId) {
    const items = activeItemsIn(quadrantId);
    if (items.length === 0) {
      focusedTaskId = null;
      /** @type {HTMLElement | null} */ (document.getElementById(`${quadrantId}-add-button`))?.focus();
      return;
    }
    const remembered = lastFocusedByQuadrant.get(quadrantId);
    const target = items.find((li) => li.dataset.id === remembered) ?? items[0];
    focusTask(/** @type {string} */ (target.dataset.id));
  }

  /**
   * Called once per render (via render.js's `afterRender` hook). Keeps
   * roving tabindex in sync and re-applies DOM focus to the tracked task id,
   * since render rebuilds every `<li>`. No-ops while a dialog is open.
   */
  function restoreAfterRender() {
    updateAllRovingTabindex();
    if (document.querySelector('dialog[open]')) return;
    if (!focusedTaskId) return;
    const li = findTaskEl(focusedTaskId);
    if (li && document.activeElement !== li) {
      li.focus();
    }
  }

  /**
   * Computes where focus should land after `taskId` is removed from
   * `quadrantId` (delete, or move away) — the next task, else the previous,
   * else the quadrant's add control — and applies it immediately, using the
   * list state *before* the removal.
   * @param {string} quadrantId
   * @param {string} taskId
   */
  function prepareFocusForRemoval(quadrantId, taskId) {
    const items = activeItemsIn(quadrantId);
    const index = items.findIndex((li) => li.dataset.id === taskId);
    if (index === -1) return;
    const next = items[index + 1] ?? items[index - 1] ?? null;
    if (next) {
      pendingFocusId = /** @type {string} */ (next.dataset.id);
      pendingFocusQuadrant = null;
    } else {
      pendingFocusId = null;
      pendingFocusQuadrant = quadrantId;
    }
  }

  /** @type {string | null} */
  let pendingFocusId = null;
  /** @type {string | null} */
  let pendingFocusQuadrant = null;

  /**
   * Applies a focus target previously computed by `prepareFocusForRemoval`.
   * Call this after the removal has been dispatched (and thus re-rendered).
   */
  function applyPendingFocus() {
    if (pendingFocusId) {
      focusTask(pendingFocusId);
    } else if (pendingFocusQuadrant) {
      focusQuadrant(pendingFocusQuadrant);
    }
    pendingFocusId = null;
    pendingFocusQuadrant = null;
  }

  /**
   * @param {string} id
   */
  function noteFocus(id) {
    focusedTaskId = id;
    const li = findTaskEl(id);
    const quadrantId = li?.closest('.quadrant')?.getAttribute('data-quadrant');
    if (quadrantId) lastFocusedByQuadrant.set(quadrantId, id);
  }

  return {
    focusTask,
    focusQuadrant,
    restoreAfterRender,
    prepareFocusForRemoval,
    applyPendingFocus,
    noteFocus,
    getFocusedTaskId: () => focusedTaskId,
  };
}
