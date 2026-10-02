import { createStore } from './core/store.js';
import { createLocalStorageAdapter } from './core/storage/local-storage.js';
import { createMemoryAdapter } from './core/storage/memory.js';
import { getQuadrant } from './core/quadrants.js';
import { activeTasks, isArchived } from './core/selectors.js';
import { initAnnouncer, announce } from './ui/announcer.js';
import { initToast, showUndoToast, showBanner } from './ui/toast.js';
import { initTheme } from './ui/theme.js';
import { initDialogs } from './ui/dialogs.js';
import { initSettingsDialog } from './ui/settings.js';
import { initTooltips } from './ui/tooltip.js';
import { createFocusController } from './ui/focus.js';
import { initKeyboard, renderShortcutsReference } from './ui/keyboard.js';
import { initDnd } from './ui/dnd.js';
import {
  createRenderer,
  initAddForms,
  initCompletedToggles,
  initTaskListInteractions,
  initArchiveRevalidation,
} from './ui/render.js';

const now = () => new Date();

async function main() {
  initAnnouncer(/** @type {HTMLElement} */ (document.getElementById('live-region')));
  initToast({
    toast: /** @type {HTMLElement} */ (document.getElementById('toast-container')),
    banner: /** @type {HTMLElement} */ (document.getElementById('banner-container')),
  });

  const localAdapter = createLocalStorageAdapter();
  const adapterAvailable = localAdapter.isAvailable ? localAdapter.isAvailable() : true;
  const adapter = adapterAvailable ? localAdapter : createMemoryAdapter();

  const store = createStore({ adapter, now });
  await store.init();

  const state = store.getState();
  if (!adapterAvailable) {
    showBanner('localStorage is unavailable in this browser. Changes will not be saved.');
  } else if (state.status === 'unavailable') {
    showBanner('Changes could not be saved. Your data may not persist after this session.');
  } else if (state.status === 'newer-version') {
    showBanner(state.notice ?? 'This data was created by a newer version of the app.', 'info');
  } else if (state.notice) {
    showBanner(state.notice, 'info');
  }

  store.subscribe(() => {
    const s = store.getState();
    if (s.status === 'unavailable') {
      showBanner('Changes could not be saved. Your data may not persist after this session.');
    }
  });

  const focus = createFocusController();

  /**
   * @param {import('./core/task.js').Task} task
   */
  function deleteTaskWithUndo(task) {
    focus.prepareFocusForRemoval(task.quadrant, task.id);
    const deleted = store.dispatch('deleteTask', { id: task.id });
    if (!deleted) return;
    focus.applyPendingFocus();
    announce(`Deleted "${task.title}". Undo available.`);
    showUndoToast(`Deleted "${task.title}"`, () => {
      store.undoDelete();
      announce(`Restored "${task.title}"`);
      focus.focusTask(task.id);
    });
  }

  const dialogs = initDialogs({ store, onDelete: deleteTaskWithUndo, focus });

  const renderer = createRenderer({ store, now, afterRender: () => focus.restoreAfterRender() });

  const addForms = initAddForms(store, { announce });
  initCompletedToggles(renderer);
  initTaskListInteractions({
    store,
    now,
    announce,
    onDelete: deleteTaskWithUndo,
    onOpenEdit: (task) => dialogs.open(task),
  });
  initArchiveRevalidation(renderer, now);

  initTheme(/** @type {HTMLButtonElement} */ (document.getElementById('theme-button')));
  initTooltips();

  /**
   * @param {string} taskId
   */
  function toggleCompleteById(taskId) {
    const task = store.getState().tasks.find((t) => t.id === taskId);
    if (!task) return;
    const wasArchived = isArchived(task, now());
    store.dispatch('toggleComplete', { id: taskId });
    const updated = store.getState().tasks.find((t) => t.id === taskId);
    if (updated?.completedAt) {
      announce(`Completed "${task.title}"`);
    } else {
      announce(wasArchived ? `Restored "${task.title}"` : `Uncompleted "${task.title}"`);
    }
  }

  /**
   * @param {string} taskId
   * @param {number} delta
   */
  function reorderTaskById(taskId, delta) {
    const task = store.getState().tasks.find((t) => t.id === taskId);
    if (!task) return;
    store.dispatch('reorderTask', { id: taskId, delta });
    const siblings = activeTasks(store.getState().tasks, task.quadrant, now());
    const index = siblings.findIndex((t) => t.id === taskId);
    if (index === -1) return;
    announce(`Moved to position ${index + 1} of ${siblings.length}`);
  }

  /**
   * @param {string} taskId
   * @param {string} toQuadrant
   */
  function moveTaskById(taskId, toQuadrant) {
    const task = store.getState().tasks.find((t) => t.id === taskId);
    if (!task) return;
    store.dispatch('moveTask', { id: taskId, toQuadrant, toIndex: Number.MAX_SAFE_INTEGER });
    focus.focusTask(taskId);
    const label = getQuadrant(toQuadrant)?.title ?? toQuadrant;
    announce(`Moved "${task.title}" to ${label}`);
  }

  function undoDeleteFromKeyboard() {
    const task = store.peekUndo();
    if (!task) return;
    store.undoDelete();
    announce(`Restored "${task.title}"`);
    focus.focusTask(task.id);
  }

  const keyboard = initKeyboard({
    store,
    now,
    focus,
    renderer,
    addForms,
    onOpenEdit: (task) => dialogs.open(task),
    onOpenSettings: () => settingsDialog.open(),
    onToggleComplete: toggleCompleteById,
    onDelete: deleteTaskWithUndo,
    onUndo: undoDeleteFromKeyboard,
    onReorder: reorderTaskById,
    onMove: moveTaskById,
    onSingleKeyChange: () => renderer.render(),
  });

  const settingsDialog = initSettingsDialog({
    openButton: /** @type {HTMLElement} */ (document.getElementById('settings-button')),
    keyboard,
  });
  renderShortcutsReference();

  initDnd({ store, announce, focus });

  // Keep the focus model in sync with native Tab navigation landing on a row
  // (not just programmatic focusTask() calls).
  /** @type {HTMLElement} */ (document.getElementById('main'))?.addEventListener('focusin', (event) => {
    const li = /** @type {HTMLElement} */ (event.target).closest('li[data-id]');
    if (li instanceof HTMLElement && li.dataset.id) focus.noteFocus(li.dataset.id);
  });

  store.subscribe(() => renderer.render());
  renderer.render();

  if (adapter.subscribe) {
    adapter.subscribe(() => {
      store.reloadFromAdapter();
    });
  }
}

main();
