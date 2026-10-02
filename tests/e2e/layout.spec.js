import { test, expect } from '@playwright/test';

/** @param {import('@playwright/test').Page} page */
async function seedUrgentLeft(page) {
  await page.addInitScript(() => {
    window.localStorage.setItem('decision-matrix:layout', 'urgent-left');
  });
}

/** @param {import('@playwright/test').Page} page */
async function boxes(page) {
  const box = async (sel) => /** @type {{ x: number, y: number }} */ (await page.locator(sel).boundingBox());
  return {
    do: await box('#quadrant-do'),
    plan: await box('#quadrant-plan'),
    limit: await box('#quadrant-limit'),
    drop: await box('#quadrant-drop'),
    urgent: await box('.axis-col-urgent'),
    notUrgent: await box('.axis-col-not-urgent'),
  };
}

test.use({ viewport: { width: 1280, height: 800 } });

test('default layout: urgent column on the right', async ({ page }) => {
  await page.goto('/');
  const b = await boxes(page);
  expect(b.do.x).toBeGreaterThan(b.plan.x);
  expect(b.limit.x).toBeGreaterThan(b.drop.x);
  expect(b.do.y).toBeLessThan(b.limit.y);
  expect(b.urgent.x).toBeGreaterThan(b.notUrgent.x);
});

test('urgent-left layout is applied on first paint', async ({ page }) => {
  await seedUrgentLeft(page);
  // Inspect the DOM before any module script runs: the inline head script
  // alone must have applied the attribute.
  await page.goto('/', { waitUntil: 'commit' });
  await page.waitForSelector('#quadrant-do');
  expect(await page.evaluate(() => document.documentElement.dataset.layout)).toBe('urgent-left');
  const b = await boxes(page);
  expect(b.do.x).toBeLessThan(b.plan.x);
  expect(b.limit.x).toBeLessThan(b.drop.x);
  expect(b.do.y).toBeLessThan(b.limit.y); // Important row stays on top
  expect(b.urgent.x).toBeLessThan(b.notUrgent.x);
});

test('urgent-left: jump keys follow priority and arrows follow the visual layout', async ({ page }) => {
  await seedUrgentLeft(page);
  await page.goto('/');

  await page.click('#do-add-button');
  await page.fill('#do-add-input', 'Ship it');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Escape');

  await page.locator('body').click();
  await page.keyboard.press('1');
  const task = page.locator('#do-list li').first();
  await expect(task).toBeFocused();

  // Do is top-left, so → goes to Plan and ← does nothing.
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#plan-add-button')).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(task).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(task).toBeFocused();

  // Ctrl+→ moves the task from Do to Plan.
  await page.keyboard.press('Control+ArrowRight');
  await expect(page.locator('#plan-list li')).toHaveText(/Ship it/);
  await expect(page.locator('#do-list li')).toHaveCount(0);
  await expect(page.locator('#plan-list li').first()).toBeFocused();
});

test('urgent-left: Tab order still follows priority', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'WebKit excludes <button> from Tab order without Full Keyboard Access');
  await seedUrgentLeft(page);
  await page.goto('/');

  await page.locator('#do-add-button').focus();
  await page.keyboard.press('Tab');
  await expect(page.locator('#plan-add-button')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#limit-add-button')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#drop-add-button')).toBeFocused();
});

test('urgent-left: mobile still stacks in priority order', async ({ page }) => {
  await seedUrgentLeft(page);
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  const b = await boxes(page);
  expect(b.do.y).toBeLessThan(b.plan.y);
  expect(b.plan.y).toBeLessThan(b.limit.y);
  expect(b.limit.y).toBeLessThan(b.drop.y);
});
