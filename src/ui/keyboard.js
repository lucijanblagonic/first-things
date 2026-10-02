/**
 * Global keyboard shortcuts (design D6): one `keydown` listener on
 * `document`, driven by a single `SHORTCUTS` table so the Settings shortcuts
 * reference can never drift from what actually runs.
 */

import { QUADRANTS, getQuadrant, horizontalNeighbour } from '../core/quadrants.js';
import { activeTasks } from '../core/selectors.js';
import { getLayout } from './settings.js';

const SHORTCUTS_KEY = 'decision-matrix:shortcuts';
const DIGIT_TO_QUADRANT = { Digit1: 'do', Digit2: 'plan', Digit3: 'limit', Digit4: 'drop' };

/**
 * @returns {boolean}
 */
function readSingleKeyEnabled() {
  try {
    const v = window.localStorage.getItem(SHORTCUTS_KEY);
    return v !== 'off';
  } catch {
    return true;
  }
}

/**
 * @param {boolean} enabled
 */
function writeSingleKeyEnabled(enabled) {
  try {
    window.localStorage.setItem(SHORTCUTS_KEY, enabled ? 'on' : 'off');
  } catch {
    // Non-fatal.
  }
}

/**
 * @param {EventTarget | null} target
 */
function isTextEntryTarget(target) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}

/**
 * WCAG 2.1.4-style gate: printable single-character keys (digits, letters,
 * '?', …) are disabled when the single-key setting is off. Named/functional
 * keys (Escape, Enter, arrows, Space) and any Ctrl/⌘ combo are exempt.
 * @param {KeyboardEvent} event
 */
function isGatedByToggle(event) {
  if (event.ctrlKey || event.metaKey) return false;
  const exempt = new Set(['Escape', 'Enter', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ']);
  if (exempt.has(event.key)) return false;
  return true;
}

/**
 * Table entries drive the keydown dispatch (`handle`), the Settings shortcuts
 * reference (grouped by `group`, design D19), and the in-button keycap hints
 * (design D15). `keys` lists alternative combos; each combo is a list of
 * logical key names (`Mod` = ⌘ on Apple, Ctrl elsewhere). `allowInText`
 * entries also run while a text field has focus.
 * @typedef {{
 *   id: string,
 *   group: 'navigate' | 'tasks' | 'app',
 *   allowInText?: boolean,
 *   keys: string[][],
 *   description: string,
 *   handle: (event: KeyboardEvent, ctx: any) => boolean,
 * }} ShortcutEntry
 */

/** @type {ShortcutEntry[]} */
export const SHORTCUTS = [
  {
    id: 'focus-quadrant',
    group: 'navigate',
    keys: [['1'], ['2'], ['3'], ['4']],
    description: 'Focus the quadrant with that priority (Do, Plan, Delegate, Eliminate)',
    handle(event, ctx) {
      if (event.shiftKey || event.ctrlKey || event.metaKey || event.altKey) return false;
      const quadrantId = DIGIT_TO_QUADRANT[event.code];
      if (!quadrantId) return false;
      ctx.focus.focusQuadrant(quadrantId);
      return true;
    },
  },
  {
    id: 'navigate-tasks',
    group: 'navigate',
    keys: [['ArrowUp'], ['ArrowDown'], ['K'], ['J']],
    description: 'Focus previous / next task in the current quadrant',
    handle(event, ctx) {
      if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return false;
      const down = event.key === 'ArrowDown' || event.key === 'j';
      const up = event.key === 'ArrowUp' || event.key === 'k';
      if (!down && !up) return false;
      const taskId = ctx.currentTaskId();
      if (!taskId) return false;
      const task = ctx.store.getState().tasks.find((t) => t.id === taskId);
      if (!task) return false;
      const siblings = activeTasks(ctx.store.getState().tasks, task.quadrant, ctx.now());
      const index = siblings.findIndex((t) => t.id === taskId);
      const targetIndex = index + (down ? 1 : -1);
      if (targetIndex < 0 || targetIndex >= siblings.length) return true; // consumed, at edge
      ctx.focus.focusTask(siblings[targetIndex].id);
      return true;
    },
  },
  {
    id: 'navigate-quadrants',
    group: 'navigate',
    keys: [['ArrowLeft'], ['ArrowRight'], ['H'], ['L']],
    description: 'Focus the quadrant to the left / right',
    handle(event, ctx) {
      if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return false;
      const right = event.key === 'ArrowRight' || event.key === 'l';
      const left = event.key === 'ArrowLeft' || event.key === 'h';
      if (!right && !left) return false;
      const currentQuadrant = ctx.currentQuadrantId();
      if (!currentQuadrant) return false;
      const target = horizontalNeighbour(currentQuadrant, left ? 'left' : 'right', getLayout());
      if (target) ctx.focus.focusQuadrant(target);
      return true;
    },
  },
  {
    id: 'add',
    group: 'tasks',
    keys: [['N'], ['C']],
    description: 'Open the add input in the current quadrant (Do if none)',
    handle(event, ctx) {
      if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return false;
      if (event.key !== 'n' && event.key !== 'c') return false;
      const quadrantId = ctx.currentQuadrantId() ?? 'do';
      ctx.addForms.openAddForm(quadrantId);
      return true;
    },
  },
  {
    id: 'edit',
    group: 'tasks',
    keys: [['Enter'], ['E']],
    description: 'Open the edit dialog for the focused task',
    handle(event, ctx) {
      if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return false;
      if (event.key !== 'Enter' && event.key !== 'e') return false;
      const taskId = ctx.currentTaskId();
      if (!taskId) return false;
      const task = ctx.store.getState().tasks.find((t) => t.id === taskId);
      if (task) ctx.onOpenEdit(task);
      return true;
    },
  },
  {
    id: 'toggle',
    group: 'tasks',
    keys: [['X'], ['Space']],
    description: 'Toggle completion of the focused task',
    handle(event, ctx) {
      if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return false;
      if (event.key !== 'x' && event.key !== ' ') return false;
      const taskId = ctx.currentTaskId();
      if (!taskId) return false;
      ctx.onToggleComplete(taskId);
      return true;
    },
  },
  {
    id: 'delete',
    group: 'tasks',
    keys: [['Backspace'], ['Delete']],
    description: 'Delete the focused task (with undo)',
    handle(event, ctx) {
      if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return false;
      if (event.key !== 'Backspace' && event.key !== 'Delete') return false;
      const taskId = ctx.currentTaskId();
      if (!taskId) return false;
      const task = ctx.store.getState().tasks.find((t) => t.id === taskId);
      if (task) ctx.onDelete(task);
      return true;
    },
  },
  {
    id: 'undo',
    group: 'tasks',
    keys: [['Mod', 'Z']],
    description: 'Undo the last delete while undo is available',
    handle(event, ctx) {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'z') return false;
      if (ctx.store.canUndo()) ctx.onUndo();
      return true;
    },
  },
  {
    id: 'reorder',
    group: 'tasks',
    keys: [['Mod', 'ArrowUp'], ['Mod', 'ArrowDown']],
    description: 'Move the focused task up / down within its quadrant',
    handle(event, ctx) {
      if (!(event.ctrlKey || event.metaKey)) return false;
      const down = event.key === 'ArrowDown';
      const up = event.key === 'ArrowUp';
      if (!down && !up) return false;
      const taskId = ctx.currentTaskId();
      if (!taskId) return false;
      event.preventDefault();
      ctx.onReorder(taskId, down ? 1 : -1);
      return true;
    },
  },
  {
    id: 'move-adjacent',
    group: 'tasks',
    keys: [['Mod', 'ArrowLeft'], ['Mod', 'ArrowRight']],
    description: 'Move the focused task to the quadrant to the left / right',
    handle(event, ctx) {
      if (!(event.ctrlKey || event.metaKey)) return false;
      const right = event.key === 'ArrowRight';
      const left = event.key === 'ArrowLeft';
      if (!right && !left) return false;
      const taskId = ctx.currentTaskId();
      if (!taskId) return false;
      const task = ctx.store.getState().tasks.find((t) => t.id === taskId);
      if (!task) return false;
      const target = horizontalNeighbour(task.quadrant, left ? 'left' : 'right', getLayout());
      if (target) {
        event.preventDefault();
        ctx.onMove(taskId, target);
      }
      return true;
    },
  },
  {
    id: 'move-to',
    group: 'tasks',
    keys: [['Shift', '1–4']],
    description: 'Move the focused task to that quadrant (appended to the end)',
    handle(event, ctx) {
      if (!event.shiftKey || event.ctrlKey || event.metaKey || event.altKey) return false;
      const quadrantId = DIGIT_TO_QUADRANT[event.code];
      if (!quadrantId) return false;
      const taskId = ctx.currentTaskId();
      if (!taskId) return false;
      ctx.onMove(taskId, quadrantId);
      return true;
    },
  },
  {
    id: 'settings',
    group: 'app',
    keys: [['?']],
    description: 'Open Settings',
    handle(event, ctx) {
      if (event.ctrlKey || event.metaKey || event.altKey) return false;
      if (event.key !== '?') return false;
      ctx.onOpenSettings();
      return true;
    },
  },
  {
    id: 'settings-mod',
    group: 'app',
    allowInText: true,
    keys: [['Mod', ',']],
    description: 'Open Settings (also while typing)',
    handle(event, ctx) {
      if (!(event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey) return false;
      if (event.code !== 'Comma') return false;
      ctx.onOpenSettings();
      return true;
    },
  },
  {
    id: 'escape',
    group: 'app',
    keys: [['Escape']],
    description: "Close the open dialog, cancel the add input, or collapse an expanded completed list",
    handle(event, ctx) {
      if (event.key !== 'Escape') return false;
      const quadrantId = ctx.currentQuadrantId();
      if (quadrantId && ctx.renderer.isCompletedExpanded(quadrantId)) {
        ctx.renderer.collapseCompleted(quadrantId);
        return true;
      }
      return false;
    },
  },
];

/** Keys handled inside the edit dialog rather than by the global listener. */
const DIALOG_KEYS = {
  save: [['Mod', 'Enter']],
  cancel: [['Escape']],
};

const IS_APPLE = /mac|iphone|ipad/i.test(
  // @ts-ignore userAgentData is not in every lib.dom version
  navigator.userAgentData?.platform ?? navigator.platform ?? '',
);

/** @type {Record<string, string>} */
const KEY_LABELS = {
  Mod: IS_APPLE ? '⌘' : 'Ctrl',
  Shift: IS_APPLE ? '⇧' : 'Shift',
  Enter: '↵',
  Escape: 'Esc',
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→',
};

/** @type {Record<string, string>} */
const SPOKEN_KEYS = {
  Mod: IS_APPLE ? 'Command' : 'Ctrl',
  ArrowUp: 'Up arrow',
  ArrowDown: 'Down arrow',
  ArrowLeft: 'Left arrow',
  ArrowRight: 'Right arrow',
  '?': 'Question mark',
  '1–4': '1 to 4',
  ',': 'Comma',
};

/** @type {Record<string, string>} */
const ARIA_KEYS = { Mod: IS_APPLE ? 'Meta' : 'Control' };

/** @param {string[]} combo */
function isSingleKey(combo) {
  return combo.length === 1 && combo[0].length === 1;
}

/**
 * Keycap hint for a control, taken from the first combo of the shortcut.
 * @param {string} id a SHORTCUTS id, or 'save' / 'cancel' for the edit dialog
 * @returns {{ labels: string[], aria: string, singleKey: boolean } | null}
 */
export function shortcutHint(id) {
  const keys = SHORTCUTS.find((s) => s.id === id)?.keys ?? DIALOG_KEYS[id];
  if (!keys) return null;
  const combo = keys[0];
  return {
    labels: combo.map((k) => KEY_LABELS[k] ?? k),
    aria: combo.map((k) => ARIA_KEYS[k] ?? k).join('+'),
    singleKey: isSingleKey(combo),
  };
}

/**
 * @param {string} label
 * @returns {HTMLElement}
 */
export function createKeycap(label) {
  const kbd = document.createElement('kbd');
  kbd.className = 'kbd';
  kbd.textContent = label;
  return kbd;
}

/** @param {string[]} labels */
function createKeycapGroup(labels) {
  const group = document.createElement('span');
  group.className = 'kbd-group';
  group.append(...labels.map(createKeycap));
  return group;
}

function singleKeysOff() {
  return document.documentElement.dataset.singleKeys === 'off';
}

/**
 * Adds a visual-only keycap to every `[data-shortcut]` control under `root`
 * and keeps its `aria-keyshortcuts` in sync with the single-key setting.
 * @param {ParentNode} [root]
 */
export function applyShortcutHints(root = document) {
  const off = singleKeysOff();
  for (const el of root.querySelectorAll('[data-shortcut]')) {
    const hint = shortcutHint(/** @type {HTMLElement} */ (el).dataset.shortcut ?? '');
    if (!hint) continue;
    if (!el.querySelector(':scope > .kbd-group')) {
      const group = createKeycapGroup(hint.labels);
      group.setAttribute('aria-hidden', 'true');
      if (hint.singleKey) group.dataset.singleKey = '';
      el.append(group);
    }
    if (hint.singleKey && off) el.removeAttribute('aria-keyshortcuts');
    else el.setAttribute('aria-keyshortcuts', hint.aria);
  }
  applySettingsButtonHints(off);
}

/**
 * The icon-only Settings button shows its shortcuts in its tooltip rather
 * than inline (design D20): `?` normally, `⌘,` / `Ctrl ,` while single-key
 * shortcuts are off (CSS toggles which group is visible).
 * @param {boolean} off
 */
function applySettingsButtonHints(off) {
  const button = document.getElementById('settings-button');
  const keys = document.getElementById('settings-tooltip-keys');
  const mod = `${ARIA_KEYS.Mod}+Comma`;
  if (button) button.setAttribute('aria-keyshortcuts', off ? mod : `? ${mod}`);
  if (keys && !keys.hasChildNodes()) {
    const single = createKeycapGroup(['?']);
    single.dataset.singleKey = '';
    const modifier = createKeycapGroup([KEY_LABELS.Mod, ',']);
    modifier.classList.add('kbd-mod-only');
    keys.append(single, modifier);
  }
}

/**
 * @param {{
 *   store: import('../core/store.js').ReturnType,
 *   now: () => Date,
 *   focus: import('./focus.js').ReturnType,
 *   renderer: { isCompletedExpanded: (id: string) => boolean, collapseCompleted: (id: string) => void },
 *   addForms: { openAddForm: (id: string) => void },
 *   onOpenEdit: (task: import('../core/task.js').Task) => void,
 *   onOpenSettings: () => void,
 *   onToggleComplete: (taskId: string) => void,
 *   onDelete: (task: import('../core/task.js').Task) => void,
 *   onUndo: () => void,
 *   onReorder: (taskId: string, delta: number) => void,
 *   onMove: (taskId: string, toQuadrant: string) => void,
 *   onSingleKeyChange?: () => void,
 * }} deps
 * @returns {{ isSingleKeyEnabled: () => boolean, setSingleKeyEnabled: (v: boolean) => void }}
 */
export function initKeyboard(deps) {
  let singleKeyEnabled = readSingleKeyEnabled();

  function syncSingleKeyAttribute() {
    if (singleKeyEnabled) delete document.documentElement.dataset.singleKeys;
    else document.documentElement.dataset.singleKeys = 'off';
  }
  syncSingleKeyAttribute();
  applyShortcutHints();

  function currentQuadrantId() {
    const el = document.activeElement;
    const section = el instanceof HTMLElement ? el.closest('.quadrant') : null;
    return section ? section.getAttribute('data-quadrant') : null;
  }

  function currentTaskId() {
    const el = document.activeElement;
    if (el instanceof HTMLElement && el.matches('li[data-id]')) return el.dataset.id ?? null;
    return null;
  }

  const ctx = {
    ...deps,
    currentQuadrantId,
    currentTaskId,
  };

  document.addEventListener('keydown', (event) => {
    if (document.querySelector('dialog[open]')) return;
    const inText = isTextEntryTarget(event.target);
    if (isGatedByToggle(event) && !singleKeyEnabled) return;

    for (const shortcut of SHORTCUTS) {
      if (inText && !shortcut.allowInText) continue;
      if (shortcut.handle(event, ctx)) {
        event.preventDefault();
        break;
      }
    }
  });

  return {
    isSingleKeyEnabled: () => singleKeyEnabled,
    setSingleKeyEnabled(value) {
      singleKeyEnabled = value;
      writeSingleKeyEnabled(value);
      syncSingleKeyAttribute();
      applyShortcutHints();
      deps.onSingleKeyChange?.();
    },
  };
}

const GROUP_TITLES = { navigate: 'Navigate', tasks: 'Tasks', app: 'App' };

/**
 * Builds the grouped shortcuts reference inside the Settings dialog from
 * `SHORTCUTS` (design D19): per group a heading and rows of description +
 * keycaps.
 */
export function renderShortcutsReference() {
  const container = document.getElementById('settings-shortcuts');
  if (!container) return;

  const blocks = Object.entries(GROUP_TITLES).map(([group, title]) => {
    const block = document.createElement('div');
    block.className = 'shortcut-group';
    const heading = document.createElement('h4');
    heading.textContent = title;
    const list = document.createElement('dl');
    list.className = 'shortcut-list';

    for (const shortcut of SHORTCUTS.filter((s) => s.group === group)) {
      const row = document.createElement('div');
      row.className = 'shortcut-row';
      const desc = document.createElement('dt');
      desc.textContent = shortcut.description;
      const keysCell = document.createElement('dd');
      keysCell.className = 'shortcut-keys';
      // Symbols like ⌘ or ↑ read poorly, so screen readers get spoken names instead.
      const spoken = document.createElement('span');
      spoken.className = 'visually-hidden';
      spoken.textContent = shortcut.keys
        .map((combo) => combo.map((k) => SPOKEN_KEYS[k] ?? k).join(' + '))
        .join(' or ');
      const visual = document.createElement('span');
      visual.setAttribute('aria-hidden', 'true');
      shortcut.keys.forEach((combo, i) => {
        if (i > 0) {
          const sep = document.createElement('span');
          sep.className = 'shortcut-keys-separator';
          sep.textContent = '/';
          visual.append(sep);
        }
        visual.append(createKeycapGroup(combo.map((k) => KEY_LABELS[k] ?? k)));
      });
      keysCell.append(spoken, visual);
      row.append(desc, keysCell);
      list.append(row);
    }

    block.append(heading, list);
    return block;
  });

  container.replaceChildren(...blocks);
}
