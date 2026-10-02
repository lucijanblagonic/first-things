/**
 * Undo toast (auto-dismissing, with an action) and persistent banner
 * (storage/version notices) — both rendered into static containers from
 * index.html.
 */

import { applyShortcutHints } from './keyboard.js';

let toastContainer = null;
let bannerContainer = null;
let toastTimer = null;

/**
 * @param {{ toast: HTMLElement, banner: HTMLElement }} containers
 */
export function initToast({ toast, banner }) {
  toastContainer = toast;
  bannerContainer = banner;
}

/**
 * @param {string} message
 * @param {() => void} onUndo
 * @param {number} [ms]
 */
export function showUndoToast(message, onUndo, ms = 5000) {
  if (!toastContainer) return;
  if (toastTimer) clearTimeout(toastTimer);
  toastContainer.replaceChildren();

  const wrapper = document.createElement('div');
  wrapper.className = 'toast';
  wrapper.setAttribute('role', 'status');

  const text = document.createElement('span');
  text.className = 'toast-message';
  text.textContent = message;

  const undoButton = document.createElement('button');
  undoButton.type = 'button';
  undoButton.className = 'button button-basic toast-undo-button';
  undoButton.dataset.shortcut = 'undo';
  undoButton.textContent = 'Undo';
  undoButton.addEventListener('click', () => {
    dismissToast();
    onUndo();
  });

  wrapper.append(text, undoButton);
  applyShortcutHints(wrapper);
  toastContainer.append(wrapper);

  toastTimer = setTimeout(dismissToast, ms);
}

export function dismissToast() {
  if (toastTimer) {
    clearTimeout(toastTimer);
    toastTimer = null;
  }
  if (toastContainer) toastContainer.replaceChildren();
}

/**
 * @param {string} message
 * @param {'error' | 'info'} [kind] 'error' uses the danger color; 'info' stays neutral.
 */
export function showBanner(message, kind = 'error') {
  if (!bannerContainer) return;
  bannerContainer.replaceChildren();
  const el = document.createElement('div');
  el.className = `banner banner-${kind}`;
  el.textContent = message;
  bannerContainer.append(el);
}

export function clearBanner() {
  if (bannerContainer) bannerContainer.replaceChildren();
}
