/**
 * Builds a single task `<li>`. All text is set via `textContent`/attributes —
 * never `innerHTML` — since task titles/notes are user data.
 * @typedef {import('../core/task.js').Task} Task
 */

import { dueStatus } from '../core/selectors.js';
import { notesPreview } from '../core/task.js';

/**
 * @param {string} iso YYYY-MM-DD
 * @returns {string} e.g. "Apr 1"
 */
function formatDue(iso) {
  const [year, month, day] = iso.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * @param {Task} task
 * @param {Date} now
 * @returns {string}
 */
function accessibleName(task, now) {
  const parts = [task.title];
  if (task.completedAt) {
    parts.push('completed');
  } else {
    const status = dueStatus(task, now);
    if (status === 'overdue') parts.push(`overdue, due ${formatDue(/** @type {string} */ (task.due))}`);
    else if (status === 'today') parts.push('due today');
    else if (status === 'future') parts.push(`due ${formatDue(/** @type {string} */ (task.due))}`);
  }
  if (task.notes) parts.push('has notes');
  return parts.join(', ');
}

/**
 * @param {Task} task
 * @param {Date} now
 * @returns {HTMLLIElement}
 */
export function buildTaskItem(task, now) {
  const li = document.createElement('li');
  li.className = 'task-item';
  li.dataset.id = task.id;
  li.tabIndex = -1;
  li.draggable = true;
  // No explicit role: the native `listitem` role (from being a <li> inside
  // a <ul>) is exactly right, and overriding it (e.g. to "group") breaks
  // the list's semantics for assistive tech.
  li.setAttribute('aria-label', accessibleName(task, now));
  if (task.completedAt) li.classList.add('task-item-completed');

  const checkboxId = `task-checkbox-${task.id}`;
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'task-checkbox';
  checkbox.id = checkboxId;
  checkbox.tabIndex = -1;
  checkbox.checked = Boolean(task.completedAt);
  checkbox.setAttribute('aria-label', `Mark "${task.title}" as ${task.completedAt ? 'not completed' : 'completed'}`);

  const main = document.createElement('div');
  main.className = 'task-main';

  const title = document.createElement('span');
  title.className = 'task-title';
  title.textContent = task.title;
  main.append(title);

  const preview = notesPreview(task.notes);
  if (preview) {
    const notes = document.createElement('span');
    notes.className = 'task-notes-preview';
    notes.textContent = preview;
    main.append(notes);
  }

  const meta = document.createElement('div');
  meta.className = 'task-meta';

  if (task.due) {
    const status = dueStatus(task, now);
    const badge = document.createElement('span');
    badge.className = 'task-due-badge';
    if (status === 'overdue') {
      badge.classList.add('task-due-overdue');
      badge.textContent = `Overdue · ${formatDue(task.due)}`;
    } else if (status === 'today') {
      badge.classList.add('task-due-today');
      badge.textContent = 'Today';
    } else {
      badge.textContent = formatDue(task.due);
    }
    meta.append(badge);
  }

  main.append(meta);

  const deleteButton = document.createElement('button');
  deleteButton.type = 'button';
  deleteButton.className = 'task-delete-button';
  deleteButton.tabIndex = -1;
  deleteButton.setAttribute('aria-label', `Delete "${task.title}"`);
  deleteButton.textContent = '✕';

  li.append(checkbox, main, deleteButton);
  return li;
}
