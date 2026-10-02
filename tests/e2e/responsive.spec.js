import { test, expect } from '@playwright/test';

test('at 375x812, quadrants stack in priority order with no horizontal scroll', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');

  const order = await page.$$eval('main.board > section.quadrant', (sections) =>
    sections.map((s) => s.getAttribute('data-quadrant')),
  );
  expect(order).toEqual(['do', 'plan', 'limit', 'drop']);

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
});

test('at 320px width, there is no horizontal scroll', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/');

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
});

test('at 320px width, quadrants stack in one column and stay usable with tasks', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/');
  await page.click('#do-add-button');
  await page.fill('#do-add-input', 'A narrow-viewport task with a somewhat long title');
  await page.keyboard.press('Enter');

  await expect(page.locator('#do-list li')).toHaveCount(1);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
});
