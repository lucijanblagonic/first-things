import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

/**
 * @param {import('@playwright/test').Page} page
 * @param {'do' | 'plan' | 'limit' | 'drop'} quadrant
 * @param {string} title
 */
async function addTask(page, quadrant, title) {
  await page.click(`#${quadrant}-add-button`);
  await page.fill(`#${quadrant}-add-input`, title);
  await page.keyboard.press('Enter');
  await page.keyboard.press('Escape');
}

/** @param {import('@playwright/test').Page} page */
async function openSettings(page) {
  await page.click('#settings-button');
  await expect(page.locator('#settings-dialog')).toBeVisible();
}

/**
 * @param {string} id
 * @param {string} title
 * @param {string} quadrant
 */
function task(id, title, quadrant) {
  return {
    id,
    title,
    notes: '',
    due: null,
    quadrant,
    order: 1000,
    createdAt: '2026-03-05T00:00:00.000Z',
    updatedAt: '2026-03-05T00:00:00.000Z',
    completedAt: null,
  };
}

const TWO_TASK_DOC = JSON.stringify({
  version: 1,
  exportedAt: '2026-10-02T08:00:00.000Z',
  tasks: [task('imported-1', 'Imported plan', 'plan'), task('imported-2', 'Imported drop', 'drop')],
});

/**
 * @param {string} content
 * @param {string} [name]
 */
function jsonFile(content, name = 'backup.json') {
  return { name, mimeType: 'application/json', buffer: Buffer.from(content) };
}

/**
 * Replaces the Clipboard API with one whose reads and writes are refused,
 * as a browser does when permission is denied.
 * @param {import('@playwright/test').Page} page
 */
async function denyClipboard(page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        readText: () => Promise.reject(new DOMException('denied', 'NotAllowedError')),
        writeText: () => Promise.reject(new DOMException('denied', 'NotAllowedError')),
      },
    });
  });
}

/** @param {import('@playwright/test').Page} page */
async function expectOnlyImportedTasks(page) {
  await expect(page.locator('.task-list li')).toHaveCount(2);
  await expect(page.locator('#plan-list li .task-title')).toHaveText('Imported plan');
  await expect(page.locator('#drop-list li .task-title')).toHaveText('Imported drop');
}

test('export downloads the board as a dated JSON file', async ({ page }) => {
  await page.goto('/');
  await addTask(page, 'do', 'First');
  await addTask(page, 'plan', 'Second');
  await openSettings(page);

  const [download] = await Promise.all([page.waitForEvent('download'), page.click('#export-button')]);

  expect(download.suggestedFilename()).toMatch(/^first-things-\d{4}-\d{2}-\d{2}\.json$/);
  const doc = JSON.parse(await readFile(await download.path(), 'utf8'));
  expect(doc.version).toBe(1);
  expect(doc.tasks.map((/** @type {{ title: string }} */ t) => t.title).sort()).toEqual(['First', 'Second']);
  await expect(page.locator('#data-status')).toHaveText('Exported 2 tasks.');
  // Exporting leaves the board alone.
  await expect(page.locator('.task-list li')).toHaveCount(2);
});

test('import replaces the board after confirmation and persists', async ({ page }) => {
  await page.goto('/');
  await addTask(page, 'do', 'Original');
  await openSettings(page);

  await page.setInputFiles('#import-file', jsonFile(TWO_TASK_DOC));

  const confirmText = page.locator('#import-confirm-text');
  await expect(page.locator('#import-confirm')).toBeVisible();
  await expect(confirmText).toContainText('1 task ');
  await expect(confirmText).toContainText('2 tasks');
  await expect(confirmText).toContainText('backup.json');
  await expect(page.locator('#import-cancel-button')).toBeFocused();
  // Nothing has changed yet.
  await expect(page.locator('#do-list li .task-title')).toHaveText('Original');

  await page.click('#import-confirm-button');

  await expect(page.locator('#data-status')).toHaveText('Imported 2 tasks.');
  await expect(page.locator('#import-confirm')).toBeHidden();
  await expect(page.locator('#data-actions')).toBeVisible();
  await expectOnlyImportedTasks(page);

  // The previous board was kept under a backup key.
  const backups = await page.evaluate(() =>
    Object.keys(window.localStorage)
      .filter((key) => key.startsWith('decision-matrix:backup-'))
      .map((key) => JSON.parse(/** @type {string} */ (window.localStorage.getItem(key))).tasks[0].title),
  );
  expect(backups).toEqual(['Original']);

  await page.reload();
  await expectOnlyImportedTasks(page);
});

test('cancelling an import leaves the board unchanged', async ({ page }) => {
  await page.goto('/');
  await addTask(page, 'do', 'Original');
  await openSettings(page);
  await page.setInputFiles('#import-file', jsonFile(TWO_TASK_DOC));
  await expect(page.locator('#import-confirm')).toBeVisible();

  await page.click('#import-cancel-button');

  await expect(page.locator('#import-confirm')).toBeHidden();
  await expect(page.locator('#data-actions')).toBeVisible();
  await expect(page.locator('#import-button')).toBeFocused();
  await expect(page.locator('.task-list li')).toHaveCount(1);
  await expect(page.locator('#do-list li .task-title')).toHaveText('Original');
});

test('closing Settings abandons a pending import', async ({ page }) => {
  await page.goto('/');
  await addTask(page, 'do', 'Original');
  await openSettings(page);
  await page.setInputFiles('#import-file', jsonFile(TWO_TASK_DOC));
  await expect(page.locator('#import-confirm')).toBeVisible();

  await page.click('#settings-close-button');
  await openSettings(page);

  await expect(page.locator('#import-confirm')).toBeHidden();
  await expect(page.locator('#data-actions')).toBeVisible();
  await expect(page.locator('#do-list li .task-title')).toHaveText('Original');
});

test('a file that is not a board is rejected', async ({ page }) => {
  await page.goto('/');
  await addTask(page, 'do', 'Original');
  await openSettings(page);

  await page.setInputFiles('#import-file', jsonFile('hello'));

  await expect(page.locator('#data-status')).toContainText('not a First Things export');
  await expect(page.locator('#import-confirm')).toBeHidden();
  await expect(page.locator('#do-list li .task-title')).toHaveText('Original');
});

test('a file from a newer version is rejected', async ({ page }) => {
  await page.goto('/');
  await addTask(page, 'do', 'Original');
  await openSettings(page);

  await page.setInputFiles('#import-file', jsonFile(JSON.stringify({ version: 999, tasks: [] })));

  await expect(page.locator('#data-status')).toContainText('newer version');
  await expect(page.locator('#import-confirm')).toBeHidden();
  await expect(page.locator('#do-list li .task-title')).toHaveText('Original');
});

test('import leaves theme and layout preferences alone', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  await page.click('#theme-button'); // System → Light
  await page.click('#theme-button'); // Light → Dark
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await openSettings(page);
  await page.check('input[name="layout"][value="urgent-left"]');

  await page.setInputFiles('#import-file', jsonFile(TWO_TASK_DOC));
  await page.click('#import-confirm-button');

  await expectOnlyImportedTasks(page);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('html')).toHaveAttribute('data-layout', 'urgent-left');
});

test('round trip: export, clear the board, import the file back', async ({ page }) => {
  await page.goto('/');
  await addTask(page, 'do', 'First');
  await addTask(page, 'limit', 'Second');
  await openSettings(page);
  const [download] = await Promise.all([page.waitForEvent('download'), page.click('#export-button')]);
  const exported = await readFile(await download.path(), 'utf8');
  const before = await page.evaluate(() => window.localStorage.getItem('decision-matrix:data'));

  await page.setInputFiles('#import-file', jsonFile(JSON.stringify({ version: 1, tasks: [] })));
  await page.click('#import-confirm-button');
  await expect(page.locator('.task-list li')).toHaveCount(0);

  await page.setInputFiles('#import-file', jsonFile(exported));
  await expect(page.locator('#import-confirm-text')).toContainText('0 tasks');
  await page.click('#import-confirm-button');

  await expect(page.locator('#do-list li .task-title')).toHaveText('First');
  await expect(page.locator('#limit-list li .task-title')).toHaveText('Second');
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem('decision-matrix:data'))).toBe(before);
});

test('copy then paste restores the board through the clipboard', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'clipboard permissions can only be granted in Chromium');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  await addTask(page, 'do', 'First');
  await addTask(page, 'plan', 'Second');
  await openSettings(page);

  await page.click('#copy-button');
  await expect(page.locator('#data-status')).toContainText('Copied 2 tasks');
  const copied = JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));
  expect(copied.tasks).toHaveLength(2);

  await page.click('#settings-close-button');
  await page.locator('#plan-list li').first().focus();
  await page.keyboard.press('Delete');
  await expect(page.locator('.task-list li')).toHaveCount(1);
  await openSettings(page);

  await page.click('#paste-button');
  const confirmText = page.locator('#import-confirm-text');
  await expect(confirmText).toContainText('1 task ');
  await expect(confirmText).toContainText('2 tasks');
  await expect(confirmText).toContainText('the clipboard');
  await page.click('#import-confirm-button');

  await expect(page.locator('#do-list li .task-title')).toHaveText('First');
  await expect(page.locator('#plan-list li .task-title')).toHaveText('Second');
});

test('pasting a clipboard that does not hold a board is rejected', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'clipboard permissions can only be granted in Chromium');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  await addTask(page, 'do', 'Original');
  await openSettings(page);
  await page.evaluate(() => navigator.clipboard.writeText('hello'));

  await page.click('#paste-button');

  await expect(page.locator('#data-status')).toContainText('does not contain a First Things board');
  await expect(page.locator('#import-confirm')).toBeHidden();
  await expect(page.locator('#paste-area')).toBeHidden();
  await expect(page.locator('#do-list li .task-title')).toHaveText('Original');
});

test('when the clipboard cannot be read, a paste field does the same job', async ({ page }) => {
  await denyClipboard(page);
  await page.goto('/');
  await addTask(page, 'do', 'Original');
  await openSettings(page);

  await page.click('#paste-button');

  await expect(page.locator('#paste-area')).toBeVisible();
  await expect(page.locator('#data-actions')).toBeHidden();
  await expect(page.locator('#paste-text')).toBeFocused();

  await page.fill('#paste-text', TWO_TASK_DOC);
  await page.click('#paste-import-button');

  await expect(page.locator('#paste-area')).toBeHidden();
  await expect(page.locator('#import-confirm-text')).toContainText('the pasted text');
  await page.click('#import-confirm-button');
  await expectOnlyImportedTasks(page);
});

test('the paste field rejects text that is not a board', async ({ page }) => {
  await denyClipboard(page);
  await page.goto('/');
  await addTask(page, 'do', 'Original');
  await openSettings(page);
  await page.click('#paste-button');

  await page.fill('#paste-text', 'hello');
  await page.click('#paste-import-button');

  await expect(page.locator('#data-status')).toContainText('not a First Things board');
  await expect(page.locator('#paste-area')).toBeHidden();
  await expect(page.locator('#data-actions')).toBeVisible();
  await expect(page.locator('#do-list li .task-title')).toHaveText('Original');
});

test('cancelling the paste field leaves the board unchanged', async ({ page }) => {
  await denyClipboard(page);
  await page.goto('/');
  await addTask(page, 'do', 'Original');
  await openSettings(page);
  await page.click('#paste-button');
  await expect(page.locator('#paste-area')).toBeVisible();

  await page.click('#paste-cancel-button');

  await expect(page.locator('#paste-area')).toBeHidden();
  await expect(page.locator('#data-actions')).toBeVisible();
  await expect(page.locator('#do-list li .task-title')).toHaveText('Original');
});

test('when the clipboard cannot be written, copy says so', async ({ page }) => {
  await denyClipboard(page);
  await page.goto('/');
  await addTask(page, 'do', 'Original');
  await openSettings(page);

  await page.click('#copy-button');

  await expect(page.locator('#data-status')).toContainText('Could not copy');
  await expect(page.locator('#do-list li .task-title')).toHaveText('Original');
});
