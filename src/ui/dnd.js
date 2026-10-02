/**
 * Native HTML5 drag & drop (design D8): drag a task row onto a quadrant to
 * reorder it or move it, with an insertion-line preview and drop-target
 * highlight. Keyboard/edit-dialog moving remain the non-drag ways to do the
 * same thing (spec: "drag & drop SHALL never be the only way").
 */

import { QUADRANTS, getQuadrant } from '../core/quadrants.js';

/**
 * @param {HTMLElement} listEl
 * @param {number} clientY
 * @param {string | null} excludeId task id to ignore (the one being dragged)
 * @returns {number}
 */
function computeInsertionIndex(listEl, clientY, excludeId) {
  const items = Array.from(listEl.querySelectorAll('li[data-id]')).filter(
    (li) => /** @type {HTMLElement} */ (li).dataset.id !== excludeId,
  );
  for (let i = 0; i < items.length; i++) {
    const rect = items[i].getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    if (clientY < midpoint) return i;
  }
  return items.length;
}

/**
 * @param {{
 *   store: import('../core/store.js').ReturnType,
 *   announce: (msg: string) => void,
 *   focus: import('./focus.js').ReturnType,
 *   onMoved?: (taskId: string) => void,
 * }} deps
 */
export function initDnd({ store, announce, focus, onMoved }) {
  /** @type {string | null} */
  let draggingId = null;
  /** @type {HTMLElement | null} */
  let highlightedSection = null;

  const insertionLine = document.createElement('div');
  insertionLine.className = 'drop-insertion-line';

  function cleanupVisuals() {
    insertionLine.remove();
    if (highlightedSection) {
      highlightedSection.classList.remove('quadrant-drag-over');
      highlightedSection = null;
    }
  }

  const main = document.getElementById('main');
  if (!main) return;

  main.addEventListener('dragstart', (event) => {
    const target = /** @type {HTMLElement} */ (event.target);
    const li = target.closest('li[data-id]');
    if (!(li instanceof HTMLElement)) return;
    draggingId = li.dataset.id ?? null;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', draggingId ?? '');
    }
    li.classList.add('task-dragging');
  });

  main.addEventListener('dragend', (event) => {
    const target = /** @type {HTMLElement} */ (event.target);
    const li = target.closest('li[data-id]');
    if (li instanceof HTMLElement) li.classList.remove('task-dragging');
    cleanupVisuals();
    draggingId = null;
  });

  for (const quadrant of QUADRANTS) {
    const section = document.getElementById(`quadrant-${quadrant.id}`);
    const listEl = /** @type {HTMLUListElement | null} */ (document.getElementById(`${quadrant.id}-list`));
    if (!section || !listEl) continue;

    section.addEventListener('dragover', (event) => {
      if (!draggingId) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';

      if (highlightedSection !== section) {
        if (highlightedSection) highlightedSection.classList.remove('quadrant-drag-over');
        section.classList.add('quadrant-drag-over');
        highlightedSection = section;
      }

      const index = computeInsertionIndex(listEl, event.clientY, draggingId);
      const items = Array.from(listEl.querySelectorAll('li[data-id]')).filter(
        (li) => /** @type {HTMLElement} */ (li).dataset.id !== draggingId,
      );
      if (index >= items.length) {
        listEl.appendChild(insertionLine);
      } else {
        listEl.insertBefore(insertionLine, items[index]);
      }
    });

    section.addEventListener('dragleave', (event) => {
      const related = /** @type {Node | null} */ (event.relatedTarget);
      if (related && section.contains(related)) return;
      if (highlightedSection === section) {
        section.classList.remove('quadrant-drag-over');
        highlightedSection = null;
      }
      insertionLine.remove();
    });

    section.addEventListener('drop', (event) => {
      event.preventDefault();
      const taskId = draggingId ?? event.dataTransfer?.getData('text/plain') ?? null;
      cleanupVisuals();
      draggingId = null;
      if (!taskId) return;

      const task = store.getState().tasks.find((t) => t.id === taskId);
      if (!task) return;

      const index = computeInsertionIndex(listEl, event.clientY, taskId);
      const wasSameQuadrant = task.quadrant === quadrant.id;
      store.dispatch('moveTask', { id: taskId, toQuadrant: quadrant.id, toIndex: index });
      focus.focusTask(taskId);
      if (onMoved) onMoved(taskId);

      if (wasSameQuadrant) {
        announce(`Reordered "${task.title}"`);
      } else {
        const label = getQuadrant(quadrant.id)?.title ?? quadrant.id;
        announce(`Moved "${task.title}" to ${label}`);
      }
    });
  }
}
