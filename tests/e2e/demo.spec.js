import { test, expect } from '@playwright/test';

// A real first visit: nothing in storage (the config default pre-saves an
// empty board for every other spec).
test.use({ storageState: { cookies: [], origins: [] } });

test('a first visit shows three example tasks', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('.task-list li')).toHaveCount(3);
  await expect(page.locator('#do-list li .task-title')).toHaveText('Pay the electricity bill');
  await expect(page.locator('#plan-list li .task-title')).toHaveText('Book a dentist appointment');
  await expect(page.locator('#drop-list li .task-title')).toHaveText('Tidy the bookmarks bar');

  // Between them they show an overdue date, a future date and notes.
  await expect(page.locator('#do-list li .task-due-overdue')).toContainText('Overdue');
  await expect(page.locator('#plan-list li .task-due-badge')).toBeVisible();
  await expect(page.locator('#plan-list li .task-due-badge')).not.toHaveClass(/task-due-overdue/);
  await expect(page.locator('#drop-list li .task-notes-preview')).toContainText('examples');
});

test('example tasks are seeded once: they survive a reload and stay deleted', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.task-list li')).toHaveCount(3);

  await page.reload();
  await expect(page.locator('.task-list li')).toHaveCount(3);

  for (let remaining = 3; remaining > 0; remaining--) {
    await page.locator('.task-list li .task-delete-button').first().click();
    await expect(page.locator('.task-list li')).toHaveCount(remaining - 1);
  }
  await page.reload();
  await expect(page.locator('.task-list li')).toHaveCount(0);
});

test('the due date sits on the same line as the task title', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  const title = await page.locator('#do-list li .task-title').boundingBox();
  const badge = await page.locator('#do-list li .task-due-badge').boundingBox();
  const notes = await page.locator('#do-list li .task-notes-preview').boundingBox();
  if (!title || !badge || !notes) throw new Error('example task is not fully rendered');

  // To the right of the title, overlapping it vertically; the notes go below both.
  expect(badge.x).toBeGreaterThanOrEqual(title.x + title.width);
  expect(badge.y).toBeLessThan(title.y + title.height);
  expect(badge.y + badge.height).toBeGreaterThan(title.y);
  expect(notes.y).toBeGreaterThanOrEqual(title.y + title.height - 1);
});
