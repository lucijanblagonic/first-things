import { test, expect } from '@playwright/test';

/** @param {import('@playwright/test').Page} page */
async function addTask(page, quadrantId, title) {
  await page.click(`#${quadrantId}-add-button`);
  await page.fill(`#${quadrantId}-add-input`, title);
  await page.keyboard.press('Enter');
  await page.click(`#${quadrantId}-add-cancel`);
}

test('reorder within a quadrant by drag persists after reload', async ({ page }) => {
  await page.goto('/');
  await addTask(page, 'do', 'A');
  await addTask(page, 'do', 'B');
  await addTask(page, 'do', 'C');

  await expect(page.locator('#do-list li .task-title')).toHaveText(['A', 'B', 'C']);

  // Drag the third task (C) above the first task (A).
  await page.locator('#do-list li', { hasText: 'C' }).dragTo(page.locator('#do-list li', { hasText: 'A' }));

  await expect(page.locator('#do-list li .task-title')).toHaveText(['C', 'A', 'B']);

  await page.reload();
  await expect(page.locator('#do-list li .task-title')).toHaveText(['C', 'A', 'B']);
});

test('move to another quadrant by dropping on its empty area persists after reload', async ({ page }) => {
  await page.goto('/');
  await addTask(page, 'limit', 'Move me');

  await expect(page.locator('#limit-list li')).toHaveCount(1);
  await expect(page.locator('#do-list li')).toHaveCount(0);

  const source = page.locator('#limit-list li', { hasText: 'Move me' });
  const targetSection = page.locator('#quadrant-do');
  await source.dragTo(targetSection);

  await expect(page.locator('#limit-list li')).toHaveCount(0);
  await expect(page.locator('#do-list li')).toHaveCount(1);
  await expect(page.locator('#do-list li .task-title')).toHaveText('Move me');

  await page.reload();
  await expect(page.locator('#limit-list li')).toHaveCount(0);
  await expect(page.locator('#do-list li')).toHaveCount(1);
  await expect(page.locator('#do-list li .task-title')).toHaveText('Move me');
});
