import { test, expect } from '@playwright/test';

// A phone-sized viewport. Layout here depends on width only, so these run in
// every browser; the one touch-specific test opts into touch emulation below.
test.use({ viewport: { width: 390, height: 664 } });

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} title
 * @param {string} [notes]
 */
async function seedTask(page, title, notes = '') {
  await page.addInitScript(
    ({ title, notes }) => {
      const iso = '2026-03-05T00:00:00.000Z';
      window.localStorage.setItem(
        'decision-matrix:data',
        JSON.stringify({
          version: 1,
          tasks: [
            { id: 'seed-1', title, notes, due: null, quadrant: 'do', order: 1000, createdAt: iso, updatedAt: iso, completedAt: null },
          ],
        }),
      );
    },
    { title, notes },
  );
}

test('the page scrolls as a whole and leaves space under the last quadrant', async ({ page }) => {
  await page.goto('/');
  const metrics = await page.evaluate(() => {
    window.scrollTo(0, document.documentElement.scrollHeight);
    const last = /** @type {Element} */ (document.getElementById('quadrant-drop')).getBoundingClientRect();
    return {
      scrolled: window.scrollY,
      pageHeight: document.documentElement.scrollHeight,
      viewport: window.innerHeight,
      gapBelowLast: document.documentElement.scrollHeight - (last.bottom + window.scrollY),
    };
  });
  // The document itself is taller than the screen and is what scrolls.
  expect(metrics.pageHeight).toBeGreaterThan(metrics.viewport);
  expect(metrics.scrolled).toBeGreaterThan(0);
  expect(metrics.gapBelowLast).toBeGreaterThanOrEqual(16);
});

test('the edit dialog fills the screen with its heading and actions pinned', async ({ page }) => {
  await seedTask(page, 'Long one', Array.from({ length: 80 }, (_, i) => `Line ${i + 1}`).join('\n'));
  await page.goto('/');
  await page.click('#do-list li .task-title');
  const dialog = page.locator('#edit-dialog');
  await expect(dialog).toBeVisible();

  const box = await dialog.boundingBox();
  expect(box).toEqual({ x: 0, y: 0, width: 390, height: 664 });

  // Shrink the notes so the form overflows, then scroll to the end: the
  // heading and the Save/Cancel bar stay on screen.
  await page.locator('#edit-notes').evaluate((el) => {
    el.style.flex = 'none';
    el.style.height = '900px';
  });
  await dialog.evaluate((el) => el.scrollTo(0, el.scrollHeight));
  for (const selector of ['#edit-dialog-title', '#edit-save-button', '#edit-cancel-button', '#edit-delete-button']) {
    await expect(page.locator(selector), selector).toBeInViewport({ ratio: 1 });
  }
  const save = await page.locator('#edit-save-button').boundingBox();
  expect(save?.height).toBeGreaterThanOrEqual(44);

  // Nothing is pushed off the side: the sheet has no horizontal overflow.
  expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
});

test('the edit actions fit a narrow phone even with the widest shortcut labels', async ({ page }) => {
  // Non-Apple platforms label Save's shortcut "Ctrl" + "Enter", the widest pair.
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'platform', { get: () => 'Linux x86_64' });
    Object.defineProperty(navigator, 'userAgentData', { get: () => undefined });
    Object.defineProperty(navigator, 'userAgent', {
      get: () => 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36',
    });
  });
  await page.setViewportSize({ width: 320, height: 568 });
  await seedTask(page, 'Narrow');
  await page.goto('/');
  await page.click('#do-list li .task-title');
  await expect(page.locator('#edit-dialog')).toBeVisible();
  for (const selector of ['#edit-delete-button', '#edit-cancel-button', '#edit-save-button']) {
    await expect(page.locator(selector), selector).toBeInViewport({ ratio: 1 });
  }
  expect(await page.locator('#edit-dialog').evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
});

test('the page behind an open dialog does not scroll', async ({ page }) => {
  await seedTask(page, 'Lock check');
  await page.goto('/');
  await page.click('#settings-button');
  await expect(page.locator('#settings-dialog')).toBeVisible();
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflowY)).toBe('hidden');

  await page.click('#settings-close-button');
  await expect(page.locator('#settings-dialog')).toBeHidden();
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflowY)).not.toBe('hidden');
});

test('Settings fills the screen and keeps its header and close button while scrolling', async ({ page }) => {
  await page.goto('/');
  await page.click('#settings-button');
  const dialog = page.locator('#settings-dialog');
  await expect(dialog).toBeVisible();
  expect(await dialog.boundingBox()).toEqual({ x: 0, y: 0, width: 390, height: 664 });

  await dialog.evaluate((el) => el.scrollTo(0, el.scrollHeight));
  await expect(page.locator('#settings-dialog-title')).toBeInViewport({ ratio: 1 });
  await expect(page.locator('#settings-close-button')).toBeInViewport({ ratio: 1 });
  await page.click('#settings-close-button');
  await expect(dialog).toBeHidden();
});

test('dialogs follow the visible viewport, so they stay above an on-screen keyboard', async ({ page }) => {
  await seedTask(page, 'Keyboard check');
  await page.goto('/');
  await page.click('#do-list li .task-title');
  const dialog = page.locator('#edit-dialog');
  await expect(dialog).toBeVisible();

  // Stand in for the keyboard: the app publishes the visual viewport as
  // --vv-height / --vv-top, and the sheet is sized from those.
  await page.evaluate(() => {
    document.documentElement.style.setProperty('--vv-height', '360px');
    document.documentElement.style.setProperty('--vv-top', '0px');
  });
  const box = await dialog.boundingBox();
  expect(box?.height).toBe(360);
  await expect(page.locator('#edit-save-button')).toBeInViewport({ ratio: 1 });
  const save = await page.locator('#edit-save-button').boundingBox();
  expect((save?.y ?? 0) + (save?.height ?? 0)).toBeLessThanOrEqual(360);
});

test.describe('touch', () => {
  test.use({ hasTouch: true, isMobile: true });

  test('opening a task on a touch device does not focus a field', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'mobile emulation (coarse pointer) is Chromium-only in Playwright');
    await seedTask(page, 'No keyboard yet');
    await page.goto('/');
    await page.locator('#do-list li .task-title').tap();
    await expect(page.locator('#edit-dialog')).toBeVisible();
    await expect(page.locator('#edit-dialog-title')).toBeFocused();
    await expect(page.locator('#edit-title')).toHaveValue('No keyboard yet');
  });
});
