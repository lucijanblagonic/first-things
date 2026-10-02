/**
 * The edit-task dialog: a native <dialog> for focus trapping and Escape
 * handling. Delete inside the dialog is delegated to `onDelete` so the same
 * undo/announce path is shared with the row's delete button.
 * @typedef {import('../core/task.js').Task} Task
 */

import { validateTitle } from '../core/task.js';

/**
 * @param {{
 *   store: import('../core/store.js').ReturnType,
 *   onDelete: (task: Task) => void,
 *   focus: import('./focus.js').ReturnType,
 * }} deps
 */
export function initDialogs({ store, onDelete, focus }) {
  const dialog = /** @type {HTMLDialogElement} */ (document.getElementById('edit-dialog'));
  const form = /** @type {HTMLFormElement} */ (document.getElementById('edit-form'));
  const titleInput = /** @type {HTMLInputElement} */ (document.getElementById('edit-title'));
  const notesInput = /** @type {HTMLTextAreaElement} */ (document.getElementById('edit-notes'));
  const dueInput = /** @type {HTMLInputElement} */ (document.getElementById('edit-due'));
  const quadrantSelect = /** @type {HTMLSelectElement} */ (document.getElementById('edit-quadrant'));
  const titleError = /** @type {HTMLElement} */ (document.getElementById('edit-title-error'));
  const deleteButton = /** @type {HTMLButtonElement} */ (document.getElementById('edit-delete-button'));
  const cancelButton = /** @type {HTMLButtonElement} */ (document.getElementById('edit-cancel-button'));

  /** @type {Task | null} */
  let currentTask = null;
  // Skips the default "focus returns to the task" on close when the task is
  // about to be deleted — deletion decides focus itself (next/prev/add button).
  let skipCloseFocus = false;

  function save() {
    if (!currentTask) return;
    const result = validateTitle(titleInput.value);
    if (!result.ok) {
      titleError.hidden = false;
      titleInput.setAttribute('aria-invalid', 'true');
      titleInput.focus();
      return;
    }
    titleError.hidden = true;
    titleInput.removeAttribute('aria-invalid');
    store.dispatch('updateTask', {
      id: currentTask.id,
      title: result.value,
      notes: notesInput.value,
      due: dueInput.value || null,
      quadrant: quadrantSelect.value,
    });
    dialog.close();
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    save();
  });

  cancelButton.addEventListener('click', () => {
    dialog.close();
  });

  deleteButton.addEventListener('click', () => {
    if (!currentTask) return;
    const task = currentTask;
    skipCloseFocus = true;
    dialog.close();
    onDelete(task);
  });

  dialog.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      save();
    }
  });

  dialog.addEventListener('close', () => {
    const task = currentTask;
    currentTask = null;
    if (!skipCloseFocus && task) {
      focus.focusTask(task.id);
    }
    skipCloseFocus = false;
  });

  return {
    /**
     * @param {Task} task
     */
    open(task) {
      currentTask = task;
      skipCloseFocus = false;
      titleInput.value = task.title;
      notesInput.value = task.notes;
      dueInput.value = task.due || '';
      quadrantSelect.value = task.quadrant;
      titleError.hidden = true;
      titleInput.removeAttribute('aria-invalid');
      dialog.showModal();
      titleInput.focus();
      titleInput.select();
    },
    isOpen() {
      return dialog.open;
    },
  };
}
