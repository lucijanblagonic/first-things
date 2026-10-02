import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

/**
 * @param {number} offsetDays days relative to `base` (negative = past)
 * @param {Date} base
 */
function iso(base, offsetDays) {
  const d = new Date(base);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString();
}

/** @param {Date} base */
function seedDocument(base) {
  return {
    version: 1,
    tasks: [
      {
        id: 't1',
        title: 'Open task',
        notes: '',
        due: null,
        quadrant: 'do',
        order: 1000,
        createdAt: iso(base, 0),
        updatedAt: iso(base, 0),
        completedAt: null,
      },
      {
        id: 't2',
        title: 'Completed today',
        notes: 'Some notes',
        due: null,
        quadrant: 'do',
        order: 2000,
        createdAt: iso(base, 0),
        updatedAt: iso(base, 0),
        completedAt: base.toISOString(),
      },
      {
        id: 't3',
        title: 'Overdue task',
        notes: '',
        due: '2020-01-01',
        quadrant: 'plan',
        order: 1000,
        createdAt: iso(base, 0),
        updatedAt: iso(base, 0),
        completedAt: null,
      },
      {
        id: 't4',
        title: 'Archived task',
        notes: '',
        due: null,
        quadrant: 'plan',
        order: 2000,
        createdAt: iso(base, -1),
        updatedAt: iso(base, -1),
        completedAt: iso(base, -1),
      },
      {
        id: 't5',
        title: 'Due today',
        notes: '',
        due: iso(base, 0).slice(0, 10),
        quadrant: 'limit',
        order: 1000,
        createdAt: iso(base, 0),
        updatedAt: iso(base, 0),
        completedAt: null,
      },
    ],
  };
}

/** @param {import('@playwright/test').Page} page */
async function seedAndOpenRichBoard(page) {
  const base = new Date('2026-03-05T12:00:00');
  await page.addInitScript((doc) => {
    window.localStorage.setItem('decision-matrix:data', JSON.stringify(doc));
  }, seedDocument(base));
  await page.goto('/');
  // Expand Plan's "Completed" disclosure so the archived task is visible too.
  await page.click('#plan-completed-toggle');
}

for (const colorScheme of /** @type {const} */ (['light', 'dark'])) {
  test(`board with tasks has no automated a11y violations (${colorScheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await seedAndOpenRichBoard(page);

    const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test(`edit dialog has no automated a11y violations (${colorScheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await seedAndOpenRichBoard(page);
    await page.click('#do-list li .task-title');
    await expect(page.locator('#edit-dialog')).toBeVisible();

    const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test(`settings dialog has no automated a11y violations (${colorScheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await seedAndOpenRichBoard(page);
    await page.click('#settings-button');
    await expect(page.locator('#settings-dialog')).toBeVisible();

    const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test(`settings import confirmation has no automated a11y violations (${colorScheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await seedAndOpenRichBoard(page);
    await page.click('#settings-button');
    await page.setInputFiles('#import-file', {
      name: 'backup.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify({ version: 1, tasks: [] })),
    });
    await expect(page.locator('#import-confirm')).toBeVisible();

    const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test(`settings paste field has no automated a11y violations (${colorScheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    // A browser that refuses clipboard reads, so Paste falls back to the field.
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { readText: () => Promise.reject(new DOMException('denied', 'NotAllowedError')) },
      });
    });
    await seedAndOpenRichBoard(page);
    await page.click('#settings-button');
    await page.click('#paste-button');
    await expect(page.locator('#paste-area')).toBeVisible();

    const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test(`board in high contrast has no automated a11y violations (${colorScheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await page.addInitScript(() => window.localStorage.setItem('decision-matrix:contrast', 'high'));
    await seedAndOpenRichBoard(page);
    await expect(page.locator('html')).toHaveAttribute('data-contrast', 'high');

    const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test(`board in urgent-left layout has no automated a11y violations (${colorScheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await page.addInitScript(() => window.localStorage.setItem('decision-matrix:layout', 'urgent-left'));
    await seedAndOpenRichBoard(page);
    await expect(page.locator('html')).toHaveAttribute('data-layout', 'urgent-left');

    const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test(`visible header tooltip has no automated a11y violations (${colorScheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await seedAndOpenRichBoard(page);
    await page.locator('#settings-button').hover();
    await expect(page.locator('#settings-button + .tooltip')).toBeVisible();
    // Wait for the fade-in to finish so contrast is measured at full opacity.
    await expect(page.locator('#settings-button + .tooltip')).toHaveCSS('opacity', '1');

    const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
}
