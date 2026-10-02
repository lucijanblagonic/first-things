/**
 * Full re-render of the board's dynamic parts (counts, task lists, empty
 * states, the "Completed (n)" control, archived lists) on every state
 * change. Static structure (headers, add forms, dialogs) lives in
 * index.html and is never touched here — see design D4.
 */

import { QUADRANTS, getQuadrant } from '../core/quadrants.js';
import { activeTasks, archivedTasks, isArchived } from '../core/selectors.js';
import { validateTitle } from '../core/task.js';
import { msUntilNextLocalMidnight } from '../core/dates.js';
import { buildTaskItem } from './task-item.js';

/**
 * @param {{ store: import('../core/store.js').ReturnType, now: () => Date, afterRender?: (state: any) => void }} options
 */
export function createRenderer({ store, now, afterRender }) {
  /** @type {Set<string>} quadrant ids whose "Completed" list is expanded */
  const expandedCompleted = new Set();

  function render() {
    const state = store.getState();
    const currentTime = now();

    for (const quadrant of QUADRANTS) {
      renderQuadrant(quadrant.id, state.tasks, currentTime);
    }

    if (typeof afterRender === 'function') afterRender(state);
  }

  /**
   * @param {string} quadrantId
   * @param {import('../core/task.js').Task[]} tasks
   * @param {Date} currentTime
   */
  function renderQuadrant(quadrantId, tasks, currentTime) {
    const listEl = /** @type {HTMLUListElement} */ (document.getElementById(`${quadrantId}-list`));
    const completedToggle = /** @type {HTMLButtonElement} */ (
      document.getElementById(`${quadrantId}-completed-toggle`)
    );
    const archivedListEl = /** @type {HTMLUListElement} */ (
      document.getElementById(`${quadrantId}-archived-list`)
    );
    if (!listEl || !completedToggle || !archivedListEl) return;

    const active = activeTasks(tasks, quadrantId, currentTime);
    const archived = archivedTasks(tasks, quadrantId, currentTime);

    const listScrollTop = listEl.scrollTop;
    listEl.replaceChildren(...active.map((t) => buildTaskItem(t, currentTime)));
    listEl.scrollTop = listScrollTop;

    if (archived.length === 0) {
      completedToggle.hidden = true;
      completedToggle.setAttribute('aria-expanded', 'false');
      archivedListEl.hidden = true;
      expandedCompleted.delete(quadrantId);
    } else {
      completedToggle.hidden = false;
      const expanded = expandedCompleted.has(quadrantId);
      completedToggle.textContent = `Completed (${archived.length})`;
      completedToggle.setAttribute('aria-expanded', String(expanded));
      archivedListEl.hidden = !expanded;

      const archivedScrollTop = archivedListEl.scrollTop;
      archivedListEl.replaceChildren(...archived.map((t) => buildTaskItem(t, currentTime)));
      archivedListEl.scrollTop = archivedScrollTop;
    }
  }

  return {
    render,
    /** @param {string} quadrantId */
    toggleCompletedExpanded(quadrantId) {
      if (expandedCompleted.has(quadrantId)) {
        expandedCompleted.delete(quadrantId);
      } else {
        expandedCompleted.add(quadrantId);
      }
      render();
    },
    /** @param {string} quadrantId */
    isCompletedExpanded(quadrantId) {
      return expandedCompleted.has(quadrantId);
    },
    /** @param {string} quadrantId */
    collapseCompleted(quadrantId) {
      if (expandedCompleted.delete(quadrantId)) render();
    },
  };
}

/**
 * Wires each quadrant's "Add task" button / inline form. These elements are
 * static (created once in index.html), so wiring happens once here rather
 * than being re-attached on every render.
 * @param {import('../core/store.js').ReturnType} store
 * @param {{ announce: (msg: string) => void }} deps
 * @returns {{ openAddForm: (quadrantId: string, opener?: HTMLElement) => void }}
 */
export function initAddForms(store, { announce }) {
  /** @type {Map<string, (opener?: HTMLElement) => void>} */
  const openers = new Map();

  for (const quadrant of QUADRANTS) {
    const addButton = /** @type {HTMLButtonElement} */ (document.getElementById(`${quadrant.id}-add-button`));
    const form = /** @type {HTMLFormElement} */ (document.getElementById(`${quadrant.id}-add-form`));
    const input = /** @type {HTMLInputElement} */ (document.getElementById(`${quadrant.id}-add-input`));
    const cancelButton = /** @type {HTMLButtonElement} */ (document.getElementById(`${quadrant.id}-add-cancel`));
    const errorEl = /** @type {HTMLElement} */ (document.getElementById(`${quadrant.id}-add-error`));
    if (!addButton || !form || !input || !cancelButton || !errorEl) continue;

    let openerEl = addButton;

    /** @param {HTMLElement} [opener] */
    function openForm(opener) {
      openerEl = opener || addButton;
      addButton.hidden = true;
      form.hidden = false;
      errorEl.hidden = true;
      input.removeAttribute('aria-invalid');
      input.value = '';
      input.focus();
    }

    function closeForm() {
      form.hidden = true;
      addButton.hidden = false;
      errorEl.hidden = true;
      input.removeAttribute('aria-invalid');
      openerEl.focus();
    }

    addButton.addEventListener('click', () => openForm(addButton));
    cancelButton.addEventListener('click', closeForm);

    const submitButton = /** @type {HTMLButtonElement} */ (form.querySelector('button[type="submit"]'));
    const loop = [input, submitButton, cancelButton];

    form.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        closeForm();
        return;
      }
      // While the form is open, Tab cycles input → Add → Cancel → input (and
      // Shift+Tab the other way) instead of leaving it. Moved by hand rather
      // than only wrapping at the ends, so it also works where the browser
      // skips buttons when tabbing (Safari without Full Keyboard Access).
      if (event.key !== 'Tab' || event.altKey || event.ctrlKey || event.metaKey) return;
      const index = loop.indexOf(/** @type {any} */ (document.activeElement));
      if (index === -1) return;
      event.preventDefault();
      loop[(index + (event.shiftKey ? loop.length - 1 : 1)) % loop.length].focus();
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const result = validateTitle(input.value);
      if (!result.ok) {
        errorEl.textContent = result.error;
        errorEl.hidden = false;
        input.setAttribute('aria-invalid', 'true');
        return;
      }
      store.dispatch('addTask', { title: result.value, quadrant: quadrant.id });
      errorEl.hidden = true;
      input.removeAttribute('aria-invalid');
      input.value = '';
      input.focus();
      const label = getQuadrant(quadrant.id)?.title ?? quadrant.id;
      announce(`Added "${result.value}" to ${label}`);
    });

    openers.set(quadrant.id, openForm);
  }

  return {
    openAddForm(quadrantId, opener) {
      openers.get(quadrantId)?.(opener);
    },
  };
}

/**
 * Wires each quadrant's "Completed (n)" disclosure button.
 * @param {ReturnType<typeof createRenderer>} renderer
 */
export function initCompletedToggles(renderer) {
  for (const quadrant of QUADRANTS) {
    const toggle = document.getElementById(`${quadrant.id}-completed-toggle`);
    if (!toggle) continue;
    toggle.addEventListener('click', () => {
      renderer.toggleCompletedExpanded(quadrant.id);
    });
  }
}

/**
 * Event-delegates checkbox toggle, delete, and click-to-edit for every task
 * row, across both the active and archived `<ul>`s of every quadrant. Tasks
 * are recreated on each render, so delegation (rather than per-row listeners)
 * keeps wiring a one-time setup.
 * @param {{
 *   store: import('../core/store.js').ReturnType,
 *   now: () => Date,
 *   announce: (msg: string) => void,
 *   onDelete: (task: import('../core/task.js').Task) => void,
 *   onOpenEdit: (task: import('../core/task.js').Task) => void,
 * }} deps
 */
export function initTaskListInteractions({ store, now, announce, onDelete, onOpenEdit }) {
  /** @param {Event} event */
  function findTask(event) {
    const target = /** @type {HTMLElement} */ (event.target);
    const li = target.closest('li[data-id]');
    if (!li) return null;
    const id = /** @type {HTMLElement} */ (li).dataset.id;
    const task = store.getState().tasks.find((t) => t.id === id);
    return task ? { task, li: /** @type {HTMLElement} */ (li) } : null;
  }

  for (const quadrant of QUADRANTS) {
    const listEl = document.getElementById(`${quadrant.id}-list`);
    const archivedListEl = document.getElementById(`${quadrant.id}-archived-list`);

    for (const container of [listEl, archivedListEl]) {
      if (!container) continue;

      container.addEventListener('change', (event) => {
        const target = /** @type {HTMLElement} */ (event.target);
        if (!target.classList.contains('task-checkbox')) return;
        const found = findTask(event);
        if (!found) return;
        const wasArchived = isArchived(found.task, now());
        store.dispatch('toggleComplete', { id: found.task.id });
        if (found.task.completedAt) {
          announce(wasArchived ? `Restored "${found.task.title}"` : `Uncompleted "${found.task.title}"`);
        } else {
          announce(`Completed "${found.task.title}"`);
        }
      });

      container.addEventListener('click', (event) => {
        const target = /** @type {HTMLElement} */ (event.target);
        if (target.classList.contains('task-checkbox')) return;

        if (target.closest('.task-delete-button')) {
          const found = findTask(event);
          if (found) onDelete(found.task);
          return;
        }

        const found = findTask(event);
        if (found) onOpenEdit(found.task);
      });
    }
  }
}

/**
 * Re-renders when archiving might need to be re-evaluated: on regaining
 * visibility/focus, and on a self-rearming timer over local midnight
 * (design D10 — archiving is derived from `now`, so a fresh render is all
 * that's needed).
 * @param {{ render: () => void }} renderer
 * @param {() => Date} now
 */
export function initArchiveRevalidation(renderer, now) {
  function reevaluate() {
    renderer.render();
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') reevaluate();
  });
  window.addEventListener('focus', reevaluate);

  function armMidnightTimer() {
    const delay = msUntilNextLocalMidnight(now()) + 1000;
    setTimeout(() => {
      reevaluate();
      armMidnightTimer();
    }, delay);
  }
  armMidnightTimer();
}
