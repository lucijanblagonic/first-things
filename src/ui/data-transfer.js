/**
 * Settings → Data (design D13–D15): take the board out as a file or as text
 * on the clipboard, and bring one in the same two ways. Bringing one in
 * always replaces the board, and only after an inline confirmation.
 */

import { serializeExport, exportFilename, parseImport } from '../core/transfer.js';

/**
 * @param {number} count
 * @returns {string} e.g. "1 task", "3 tasks"
 */
function taskCount(count) {
  return `${count} ${count === 1 ? 'task' : 'tasks'}`;
}

/**
 * @param {{
 *   store: {
 *     getState: () => { tasks: import('../core/task.js').Task[] },
 *     replaceAll: (tasks: import('../core/task.js').Task[]) => Promise<boolean>,
 *   },
 *   now: () => Date,
 * }} deps
 */
export function initDataTransfer({ store, now }) {
  const byId = (/** @type {string} */ id) => /** @type {HTMLElement} */ (document.getElementById(id));
  const dialog = byId('settings-dialog');
  const actions = byId('data-actions');
  const exportButton = byId('export-button');
  const copyButton = byId('copy-button');
  const importButton = byId('import-button');
  const pasteButton = byId('paste-button');
  const fileInput = /** @type {HTMLInputElement} */ (byId('import-file'));
  const pasteArea = byId('paste-area');
  const pasteText = /** @type {HTMLTextAreaElement} */ (byId('paste-text'));
  const pasteImportButton = byId('paste-import-button');
  const pasteCancelButton = byId('paste-cancel-button');
  const confirmArea = byId('import-confirm');
  const confirmText = byId('import-confirm-text');
  const confirmButton = byId('import-confirm-button');
  const cancelButton = byId('import-cancel-button');
  const status = byId('data-status');

  /** Tasks waiting for the user's confirmation, if any. */
  /** @type {import('../core/task.js').Task[] | null} */
  let pendingTasks = null;

  /**
   * `#data-status` is a role="status" live region, so setting its text is
   * what announces it; no separate announcer call (it would be read twice).
   * @param {string} message
   */
  function setStatus(message) {
    status.textContent = message;
  }

  /** Back to the four buttons, with nothing pending. */
  function showActions() {
    pendingTasks = null;
    confirmArea.hidden = true;
    pasteArea.hidden = true;
    pasteText.value = '';
    actions.hidden = false;
  }

  /**
   * Checks incoming text and either explains why it was rejected or asks for
   * confirmation. Shared by the file, clipboard and paste-field paths.
   * @param {string} raw
   * @param {string} sourceLabel where the text came from, e.g. a file name
   * @param {{ invalid: string, newer: string }} rejections message per rejection reason
   * @returns {boolean} whether the confirmation is now showing
   */
  function handleImportText(raw, sourceLabel, rejections) {
    const result = parseImport(raw);
    if (result.status !== 'ok') {
      setStatus(rejections[result.status]);
      return false;
    }

    pendingTasks = result.tasks;
    const current = store.getState().tasks.length;
    confirmText.textContent = `Replace the ${taskCount(current)} on this board with ${taskCount(result.tasks.length)} from ${sourceLabel}?`;
    setStatus('');
    actions.hidden = true;
    pasteArea.hidden = true;
    confirmArea.hidden = false;
    // The confirmation is a group labelled by the question, so moving focus
    // into it reads the question out.
    cancelButton.focus();
    return true;
  }

  exportButton.addEventListener('click', () => {
    const { tasks } = store.getState();
    const url = URL.createObjectURL(new Blob([serializeExport(tasks, now())], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = exportFilename(now());
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setStatus(`Exported ${taskCount(tasks.length)}.`);
  });

  copyButton.addEventListener('click', async () => {
    const { tasks } = store.getState();
    try {
      await navigator.clipboard.writeText(serializeExport(tasks, now()));
      setStatus(`Copied ${taskCount(tasks.length)}. Paste them into First Things on your other device.`);
    } catch {
      // No Clipboard API (insecure context, old browser) or permission refused.
      setStatus('Could not copy to the clipboard. Use Export file instead.');
    }
  });

  importButton.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    // Cleared so choosing the same file again fires `change` again.
    fileInput.value = '';
    if (!file) return;
    /** @type {string} */
    let raw;
    try {
      raw = await file.text();
    } catch {
      setStatus('That file could not be read. Nothing was changed.');
      return;
    }
    handleImportText(raw, file.name, {
      invalid: 'That file is not a First Things export. Nothing was changed.',
      newer: 'That file was made by a newer version of the app. Nothing was changed.',
    });
  });

  pasteButton.addEventListener('click', async () => {
    /** @type {string} */
    let text;
    try {
      // Must be called directly in the click handler: Safari and Firefox only
      // allow clipboard reads during a user gesture, behind their own prompt.
      text = await navigator.clipboard.readText();
    } catch {
      // Reading refused or unsupported: let the user paste by hand instead.
      setStatus('');
      actions.hidden = true;
      pasteText.value = '';
      pasteArea.hidden = false;
      pasteText.focus();
      return;
    }
    handleImportText(text, 'the clipboard', {
      invalid: 'The clipboard does not contain a First Things board. Nothing was changed.',
      newer: 'The board on the clipboard was made by a newer version of the app. Nothing was changed.',
    });
  });

  pasteImportButton.addEventListener('click', () => {
    const raw = pasteText.value;
    const confirming = handleImportText(raw, 'the pasted text', {
      invalid: 'The pasted text is not a First Things board. Nothing was changed.',
      newer: 'The pasted board was made by a newer version of the app. Nothing was changed.',
    });
    if (!confirming) {
      showActions();
      pasteButton.focus();
    }
  });

  pasteCancelButton.addEventListener('click', () => {
    showActions();
    pasteButton.focus();
  });

  cancelButton.addEventListener('click', () => {
    showActions();
    importButton.focus();
  });

  confirmButton.addEventListener('click', async () => {
    const tasks = pendingTasks;
    if (!tasks) return;
    const applied = await store.replaceAll(tasks);
    showActions();
    importButton.focus();
    setStatus(
      applied
        ? `Imported ${taskCount(tasks.length)}.`
        : 'This board was saved by a newer version of the app, so the import was not applied.',
    );
  });

  // Closing Settings abandons a pending confirmation or half-typed paste.
  dialog.addEventListener('close', () => {
    showActions();
    setStatus('');
  });
}
