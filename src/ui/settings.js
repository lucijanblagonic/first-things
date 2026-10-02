/**
 * User settings that live outside the task data (design D16, D18): the
 * quadrant layout direction and the contrast level, plus the Settings dialog
 * that hosts them, the single-key shortcuts toggle and the shortcuts reference.
 */

import { LAYOUTS } from '../core/quadrants.js';
import { announce } from './announcer.js';

const LAYOUT_KEY = 'decision-matrix:layout';
const DEFAULT_LAYOUT = 'urgent-right';
const CONTRAST_KEY = 'decision-matrix:contrast';

/**
 * Current layout direction, read from the `<html>` attribute that the inline
 * head script (and `setLayout`) maintain.
 * @returns {'urgent-right' | 'urgent-left'}
 */
export function getLayout() {
  return document.documentElement.dataset.layout === 'urgent-left' ? 'urgent-left' : DEFAULT_LAYOUT;
}

/**
 * Applies and persists the layout direction. Unknown values fall back to the
 * default. Persisting is best-effort: without storage it still applies for
 * the current session.
 * @param {string} value one of LAYOUTS
 * @param {{ silent?: boolean }} [options]
 */
export function setLayout(value, { silent = false } = {}) {
  const layout = LAYOUTS.includes(value) ? value : DEFAULT_LAYOUT;
  if (layout === DEFAULT_LAYOUT) delete document.documentElement.dataset.layout;
  else document.documentElement.dataset.layout = layout;
  try {
    window.localStorage.setItem(LAYOUT_KEY, layout);
  } catch {
    // Non-fatal: the setting just won't survive reload.
  }
  if (!silent) {
    announce(`Layout: urgent column on the ${layout === 'urgent-left' ? 'left' : 'right'}`);
  }
}

/**
 * Whether the stronger-outline look is on, read from the `<html>` attribute
 * that the inline head script (and `setHighContrast`) maintain. Until the
 * user chooses, it follows the OS "increase contrast" preference.
 * @returns {boolean}
 */
export function isHighContrast() {
  return document.documentElement.dataset.contrast === 'high';
}

/**
 * Applies and persists the contrast level. Both values are stored, so an
 * explicit "off" also overrides the OS preference. Persisting is best-effort.
 * @param {boolean} on
 */
export function setHighContrast(on) {
  if (on) document.documentElement.dataset.contrast = 'high';
  else delete document.documentElement.dataset.contrast;
  try {
    window.localStorage.setItem(CONTRAST_KEY, on ? 'high' : 'normal');
  } catch {
    // Non-fatal: the setting just won't survive reload.
  }
  announce(`High contrast ${on ? 'on' : 'off'}`);
}

/**
 * Wires the Settings dialog (design D18): open/close, focus return, backdrop
 * click, the layout radios and the single-key shortcuts checkbox. The
 * shortcuts reference inside it is rendered by keyboard.js.
 * @param {{
 *   openButton: HTMLElement,
 *   keyboard: { isSingleKeyEnabled: () => boolean, setSingleKeyEnabled: (v: boolean) => void },
 * }} deps
 * @returns {{ open: () => void, isOpen: () => boolean }}
 */
export function initSettingsDialog({ openButton, keyboard }) {
  const dialog = /** @type {HTMLDialogElement} */ (document.getElementById('settings-dialog'));
  const closeButton = /** @type {HTMLButtonElement} */ (document.getElementById('settings-close-button'));
  const singleKeyToggle = /** @type {HTMLInputElement} */ (document.getElementById('single-key-shortcuts-toggle'));
  const contrastToggle = /** @type {HTMLInputElement} */ (document.getElementById('high-contrast-toggle'));
  const radios = /** @type {HTMLInputElement[]} */ ([...dialog.querySelectorAll('input[name="layout"]')]);
  /** @type {HTMLElement | null} */
  let returnFocusEl = null;

  function syncControls() {
    const layout = getLayout();
    for (const radio of radios) radio.checked = radio.value === layout;
    singleKeyToggle.checked = keyboard.isSingleKeyEnabled();
    contrastToggle.checked = isHighContrast();
  }

  function open() {
    if (dialog.open) return;
    returnFocusEl = /** @type {HTMLElement} */ (document.activeElement);
    syncControls();
    dialog.showModal();
    (radios.find((r) => r.checked) ?? radios[0]).focus();
  }

  openButton.addEventListener('click', open);
  closeButton.addEventListener('click', () => dialog.close());

  // Clicks on the ::backdrop target the dialog itself but land outside its box.
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    const inside =
      event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
    if (!inside) dialog.close();
  });

  dialog.addEventListener('close', () => {
    // `close` fires asynchronously, so focus may already have moved on by
    // the time this runs; only restore it if nothing else has taken it.
    const active = document.activeElement;
    const focusMovedOn = active instanceof HTMLElement && active !== document.body && !dialog.contains(active);
    if (!focusMovedOn && returnFocusEl && document.contains(returnFocusEl)) returnFocusEl.focus();
    returnFocusEl = null;
  });

  for (const radio of radios) {
    radio.addEventListener('change', () => {
      if (radio.checked) setLayout(radio.value);
    });
  }

  contrastToggle.addEventListener('change', () => {
    setHighContrast(contrastToggle.checked);
  });

  singleKeyToggle.addEventListener('change', () => {
    keyboard.setSingleKeyEnabled(singleKeyToggle.checked);
  });

  return { open, isOpen: () => dialog.open };
}
