import { test, expect } from '@playwright/test';

/** @param {number} offsetDays */
function isoDay(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString();
}

const SEED = {
  version: 1,
  tasks: [
    {
      id: 'open',
      title: 'Open task',
      notes: 'Has notes',
      due: isoDay(3).slice(0, 10),
      quadrant: 'do',
      order: 1000,
      createdAt: isoDay(0),
      updatedAt: isoDay(0),
      completedAt: null,
    },
    {
      id: 'done',
      title: 'Completed today',
      notes: '',
      due: null,
      quadrant: 'do',
      order: 2000,
      createdAt: isoDay(0),
      updatedAt: isoDay(0),
      completedAt: new Date().toISOString(),
    },
    {
      id: 'overdue',
      title: 'Overdue task',
      notes: '',
      due: '2020-01-01',
      quadrant: 'plan',
      order: 1000,
      createdAt: isoDay(0),
      updatedAt: isoDay(0),
      completedAt: null,
    },
    {
      id: 'today',
      title: 'Due today',
      notes: '',
      due: isoDay(0).slice(0, 10),
      quadrant: 'limit',
      order: 1000,
      createdAt: isoDay(0),
      updatedAt: isoDay(0),
      completedAt: null,
    },
  ],
};

/** @param {import('@playwright/test').Page} page */
async function openSeededBoard(page) {
  await page.addInitScript((doc) => {
    if (!window.sessionStorage.getItem('seeded')) {
      window.localStorage.setItem('decision-matrix:data', JSON.stringify(doc));
      window.sessionStorage.setItem('seeded', '1');
    }
  }, SEED);
  await page.goto('/');
  await expect(page.locator('#do-list li')).toHaveCount(2);
}

/**
 * Returns every rendered element/property whose computed color is chromatic
 * (R, G and B not all equal). Transparent/none/auto values count as neutral.
 * @param {import('@playwright/test').Page} page
 * @param {string} rootSelector
 */
function findChromaticColors(page, rootSelector) {
  return page.evaluate((selector) => {
    const PROPS = [
      'color',
      'background-color',
      'border-top-color',
      'border-right-color',
      'border-bottom-color',
      'border-left-color',
      'outline-color',
      'accent-color',
      'fill',
      'stroke',
    ];
    /** @param {string} value */
    function isNeutral(value) {
      const nums = value.match(/-?\d*\.?\d+(e-?\d+)?/gi);
      if (!nums || nums.length < 3) return true;
      const [r, g, b] = nums.slice(0, 3).map(Number);
      const tolerance = value.startsWith('color(') ? 0.005 : 1;
      return Math.abs(r - g) <= tolerance && Math.abs(g - b) <= tolerance;
    }
    const offenders = [];
    for (const root of document.querySelectorAll(selector)) {
      for (const el of [root, ...root.querySelectorAll('*')]) {
        if (el.getClientRects().length === 0) continue;
        const style = getComputedStyle(el);
        if (style.visibility === 'hidden') continue;
        for (const prop of PROPS) {
          const value = style.getPropertyValue(prop);
          if (value && !isNeutral(value)) {
            offenders.push(`${el.tagName.toLowerCase()}.${el.className} ${prop}: ${value}`);
          }
        }
      }
    }
    return offenders;
  }, rootSelector);
}

test('quadrant titles, subtitles and axis headers are shown on wide viewports', async ({ page }) => {
  await page.goto('/');

  const expected = [
    ['do', 'Do', 'Urgent and important'],
    ['plan', 'Plan', 'Important but not urgent'],
    ['limit', 'Delegate', 'Urgent but not important'],
    ['drop', 'Eliminate', 'Not urgent and not important'],
  ];
  for (const [id, title, subtitle] of expected) {
    await expect(page.locator(`#${id}-heading`)).toHaveText(title);
    await expect(page.locator(`#${id}-subtitle`)).toHaveText(subtitle);
    await expect(page.getByRole('region', { name: `${title} — ${subtitle}` })).toBeVisible();
  }

  await expect(page.locator('.axis-col-not-urgent')).toHaveText(/not urgent/i);
  await expect(page.locator('.axis-col-urgent')).toHaveText(/^urgent$/i);
  await expect(page.locator('.axis-row-top')).toHaveText(/^important$/i);
  await expect(page.locator('.axis-row-bottom')).toHaveText(/not important/i);
  for (const cls of ['.axis-col-not-urgent', '.axis-col-urgent', '.axis-row-top', '.axis-row-bottom']) {
    await expect(page.locator(cls)).toBeVisible();
  }

  // Column headers sit above the matching columns.
  const urgentBox = await page.locator('.axis-col-urgent').boundingBox();
  const doBox = await page.locator('#quadrant-do').boundingBox();
  expect(urgentBox && doBox && urgentBox.x >= doBox.x - 1).toBe(true);
});

test('axis headers are hidden on narrow viewports', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  for (const cls of ['.axis-col-not-urgent', '.axis-col-urgent', '.axis-row-top', '.axis-row-bottom']) {
    await expect(page.locator(cls)).toBeHidden();
  }
  await expect(page.locator('#do-subtitle')).toBeVisible();
});

test('quadrant title is larger than task titles and shows a priority keycap', async ({ page }) => {
  await openSeededBoard(page);
  const [titleSize, taskSize] = await page.evaluate(() => [
    parseFloat(getComputedStyle(document.querySelector('#do-heading')).fontSize),
    parseFloat(getComputedStyle(document.querySelector('#do-list .task-title')).fontSize),
  ]);
  expect(titleSize).toBeGreaterThan(taskSize);
  await expect(page.locator('#quadrant-do .quadrant-key')).toHaveText('1');
  await expect(page.locator('#quadrant-drop .quadrant-key')).toHaveText('4');
});

test('"Add task" shows an N keycap without changing its accessible name', async ({ page }) => {
  await page.goto('/');
  const addButton = page.locator('#do-add-button');
  await expect(addButton.locator('.kbd')).toHaveText('N');
  await expect(addButton.locator('.kbd')).toBeVisible();
  await expect(addButton).toHaveAccessibleName('Add task');
  await expect(addButton).toHaveAttribute('aria-keyshortcuts', 'N');

  await expect(page.locator('#settings-tooltip-keys .kbd').first()).toHaveText('?');
  await expect(page.locator('#settings-button')).toHaveAccessibleName('Settings');
});

test('turning single-key shortcuts off hides single-key keycaps only, and persists', async ({ page }) => {
  await openSeededBoard(page);

  await page.click('#settings-button');
  await page.uncheck('#single-key-shortcuts-toggle');
  await page.click('#settings-close-button');

  const assertOffState = async () => {
    await expect(page.locator('#do-add-button .kbd-group')).toBeHidden();
    await page.locator('#settings-button').hover();
    await expect(page.locator('#settings-tooltip-keys .kbd-group[data-single-key]')).toBeHidden();
    await expect(page.locator('#settings-tooltip-keys .kbd-mod-only')).toBeVisible();
    await expect(page.locator('#settings-button')).toHaveAttribute('aria-keyshortcuts', /^(Meta|Control)\+Comma$/);
    await page.mouse.move(0, 400);
    await expect(page.locator('#do-add-button')).not.toHaveAttribute('aria-keyshortcuts', /.*/);

    await page.click('#do-list li .task-title >> nth=0');
    await expect(page.locator('#edit-dialog')).toBeVisible();
    await expect(page.locator('#edit-save-button .kbd-group')).toBeVisible();
    await expect(page.locator('#edit-cancel-button .kbd-group')).toBeVisible();
    await expect(page.locator('#edit-save-button')).toHaveAttribute('aria-keyshortcuts', /^(Meta|Control)\+Enter$/);
    await expect(page.locator('#edit-cancel-button')).toHaveAttribute('aria-keyshortcuts', 'Escape');
    await page.click('#edit-cancel-button');
  };

  await assertOffState();

  await page.locator('#limit-list li .task-delete-button').click();
  await expect(page.locator('.toast-undo-button .kbd-group')).toBeVisible();
  await expect(page.locator('.toast-undo-button')).toHaveAccessibleName('Undo');
  await page.locator('.toast-undo-button').click();

  await page.reload();
  await assertOffState();
});

test('board with open, completed and overdue tasks uses only neutral colors', async ({ page }) => {
  for (const colorScheme of /** @type {const} */ (['light', 'dark'])) {
    await page.emulateMedia({ colorScheme });
    await openSeededBoard(page);
    await expect(page.locator('.task-due-overdue')).toBeVisible();

    expect(await findChromaticColors(page, 'body')).toEqual([]);

    await page.click('#do-list li .task-title >> nth=0');
    await expect(page.locator('#edit-dialog')).toBeVisible();
    expect(await findChromaticColors(page, '#edit-dialog')).toEqual([]);
    await page.click('#edit-cancel-button');
  }
});

test('validation errors use the error color together with text', async ({ page }) => {
  await page.goto('/');
  await page.click('#do-add-button');
  await page.keyboard.press('Enter');

  const error = page.locator('#do-add-error');
  await expect(error).toBeVisible();
  await expect(error).toHaveText(/title is required/i);
  await expect(page.locator('#do-add-input')).toHaveAttribute('aria-invalid', 'true');

  expect(await findChromaticColors(page, '#do-add-error')).not.toEqual([]);
  const inputOffenders = await findChromaticColors(page, '#do-add-input');
  expect(inputOffenders.some((o) => o.includes('border'))).toBe(true);
});

test('dark mode: keycaps in dialogs stand out from the dialog surface', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await openSeededBoard(page);
  await page.click('#do-list li .task-title >> nth=0');
  await expect(page.locator('#edit-dialog')).toBeVisible();

  const result = await page.evaluate(() => {
    /** @param {string} value */
    const rgb = (value) => (value.match(/\d+(\.\d+)?/g) ?? []).slice(0, 3).map(Number);
    /** @param {number[]} c */
    const luminance = (c) => {
      const [r, g, b] = c.map((v) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    /** @param {number[]} a @param {number[]} b */
    const contrast = (a, b) => {
      const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
      return (hi + 0.05) / (lo + 0.05);
    };
    const dialogBg = rgb(getComputedStyle(document.getElementById('edit-dialog')).backgroundColor);
    const kbd = /** @type {HTMLElement} */ (document.querySelector('#edit-cancel-button .kbd'));
    const style = getComputedStyle(kbd);
    return {
      border: contrast(rgb(style.borderTopColor), dialogBg),
      text: contrast(rgb(style.color), rgb(style.backgroundColor)),
      bgDiffers: style.backgroundColor !== getComputedStyle(document.getElementById('edit-dialog')).backgroundColor,
    };
  });
  expect(result.border).toBeGreaterThanOrEqual(3);
  expect(result.text).toBeGreaterThanOrEqual(4.5);
  expect(result.bgDiffers).toBe(true);
});
