/**
 * Theme preference control: System → Light → Dark → System, persisted and
 * kept live against the OS color-scheme. Rendered as an icon button whose
 * icon, accessible name and tooltip follow the preference (design D21).
 */

import { announce } from './announcer.js';

const STORAGE_KEY = 'decision-matrix:theme';
const ORDER = ['system', 'light', 'dark'];
const LABEL = { system: 'System', light: 'Light', dark: 'Dark' };
// Page background per theme (--color-bg in tokens.css), mirrored into the
// <meta name="theme-color"> tags so browser/app chrome matches a manual choice.
const THEME_COLOR = { light: '#f5f5f5', dark: '#141414' };

/**
 * @returns {'system' | 'light' | 'dark'}
 */
function readPreference() {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (value === 'light' || value === 'dark' || value === 'system') return value;
  } catch {
    // ignore; fall through to default
  }
  return 'system';
}

/**
 * @param {'system' | 'light' | 'dark'} pref
 */
function writePreference(pref) {
  try {
    window.localStorage.setItem(STORAGE_KEY, pref);
  } catch {
    // Non-fatal: the preference just won't survive reload.
  }
}

/**
 * @param {'system' | 'light' | 'dark'} pref
 */
function applyPreference(pref) {
  if (pref === 'system') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', pref);
  }
  for (const meta of document.querySelectorAll('meta[name="theme-color"]')) {
    const scheme = (meta.getAttribute('media') ?? '').includes('dark') ? 'dark' : 'light';
    meta.setAttribute('content', THEME_COLOR[pref === 'system' ? scheme : pref]);
  }
}

/**
 * Wires the header theme button: cycles the preference, persists it, applies
 * it, and keeps its icon, accessible name and tooltip in sync. Also reacts to OS scheme changes
 * while the preference is 'system' (purely cosmetic; CSS already follows the
 * media query — this only matters for consumers that read the button's name).
 * @param {HTMLButtonElement} button
 */
export function initTheme(button) {
  let pref = readPreference();
  applyPreference(pref);
  updateButton();

  function updateButton() {
    const name = `Theme: ${LABEL[pref]}`;
    button.dataset.pref = pref;
    button.setAttribute('aria-label', name);
    const tooltipText = button.parentElement?.querySelector('.tooltip-text');
    if (tooltipText) tooltipText.textContent = name;
  }

  button.addEventListener('click', () => {
    const nextIndex = (ORDER.indexOf(pref) + 1) % ORDER.length;
    pref = /** @type {'system' | 'light' | 'dark'} */ (ORDER[nextIndex]);
    writePreference(pref);
    applyPreference(pref);
    updateButton();
    announce(`Theme: ${LABEL[pref]}`);
  });

  if (window.matchMedia) {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      // No DOM change needed: the stylesheet media query already reacts.
      // This listener exists so future consumers (e.g. tests) can hook OS changes.
    };
    if (media.addEventListener) {
      media.addEventListener('change', onChange);
    } else if (media.addListener) {
      media.addListener(onChange);
    }
  }
}
