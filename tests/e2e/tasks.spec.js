import { test, expect } from '@playwright/test';

// Each test gets a fresh, isolated browser context from Playwright, so
// localStorage already starts empty — no explicit clearing needed, and
// clearing via addInitScript would also fire (and wipe state) on reload.

test('add a task via the inline form', async ({ page }) => {
  await page.goto('/');
  await page.click('#plan-add-button');
  await page.fill('#plan-add-input', 'Write roadmap');
  await page.keyboard.press('Enter');

  await expect(page.locator('#plan-list li')).toHaveCount(1);
  await expect(page.locator('#plan-list li .task-title')).toHaveText('Write roadmap');
  // Input stays open and empty for rapid entry.
  await expect(page.locator('#plan-add-input')).toBeVisible();
  await expect(page.locator('#plan-add-input')).toHaveValue('');
});

test('empty title shows a validation message and does not create a task', async ({ page }) => {
  await page.goto('/');
  await page.click('#do-add-button');
  await page.keyboard.press('Enter');

  await expect(page.locator('#do-add-error')).toBeVisible();
  await expect(page.locator('#do-list li')).toHaveCount(0);
});

test('cancel add closes the input without creating a task', async ({ page }) => {
  await page.goto('/');
  await page.click('#do-add-button');
  await page.fill('#do-add-input', 'Should not be created');
  await page.keyboard.press('Escape');

  await expect(page.locator('#do-add-form')).toBeHidden();
  await expect(page.locator('#do-list li')).toHaveCount(0);
});

test('edit all fields of a task', async ({ page }) => {
  await page.goto('/');
  await page.click('#do-add-button');
  await page.fill('#do-add-input', 'Original title');
  await page.keyboard.press('Enter');

  await page.click('#do-list li .task-title');
  await expect(page.locator('#edit-dialog')).toBeVisible();

  await page.fill('#edit-title', 'New title');
  await page.fill('#edit-notes', 'Some notes');
  await page.fill('#edit-due', '2026-04-01');
  await page.selectOption('#edit-quadrant', 'plan');
  await page.click('#edit-save-button');

  await expect(page.locator('#edit-dialog')).toBeHidden();
  await expect(page.locator('#do-list li')).toHaveCount(0);
  await expect(page.locator('#plan-list li .task-title')).toHaveText('New title');
  await expect(page.locator('#plan-list li .task-notes-preview')).toBeVisible();
});

test('cancel edit discards changes', async ({ page }) => {
  await page.goto('/');
  await page.click('#do-add-button');
  await page.fill('#do-add-input', 'Keep me');
  await page.keyboard.press('Enter');

  await page.click('#do-list li .task-title');
  await page.fill('#edit-title', 'Changed');
  await page.click('#edit-cancel-button');

  await expect(page.locator('#do-list li .task-title')).toHaveText('Keep me');
});

test('complete and uncomplete a task', async ({ page }) => {
  await page.goto('/');
  await page.click('#do-add-button');
  await page.fill('#do-add-input', 'Task A');
  await page.keyboard.press('Enter');

  await expect(page.locator('#do-count')).toHaveText('1');
  await page.locator('#do-list li .task-checkbox').check();
  await expect(page.locator('#do-list li')).toHaveClass(/task-item-completed/);
  await expect(page.locator('#do-count')).toHaveText('0');

  await page.locator('#do-list li .task-checkbox').uncheck();
  await expect(page.locator('#do-list li')).not.toHaveClass(/task-item-completed/);
  await expect(page.locator('#do-count')).toHaveText('1');
});

test('delete a task with undo', async ({ page }) => {
  await page.goto('/');
  await page.click('#do-add-button');
  await page.fill('#do-add-input', 'Delete me');
  await page.keyboard.press('Enter');

  await page.locator('#do-list li .task-delete-button').click();
  await expect(page.locator('#do-list li')).toHaveCount(0);
  await expect(page.locator('.toast-undo-button')).toBeVisible();

  await page.click('.toast-undo-button');
  await expect(page.locator('#do-list li')).toHaveCount(1);
  await expect(page.locator('#do-list li .task-title')).toHaveText('Delete me');
});

test('overdue task shows an Overdue label', async ({ page }) => {
  await page.goto('/');
  await page.click('#do-add-button');
  await page.fill('#do-add-input', 'Overdue task');
  await page.keyboard.press('Enter');

  await page.click('#do-list li .task-title');
  await page.fill('#edit-due', '2020-01-01');
  await page.click('#edit-save-button');

  await expect(page.locator('#do-list li .task-due-overdue')).toContainText('Overdue');
});

test('persists tasks across reload', async ({ page }) => {
  await page.goto('/');
  await page.click('#limit-add-button');
  await page.fill('#limit-add-input', 'Persisted task');
  await page.keyboard.press('Enter');
  await expect(page.locator('#limit-list li')).toHaveCount(1);

  await page.reload();
  await expect(page.locator('#limit-list li')).toHaveCount(1);
  await expect(page.locator('#limit-list li .task-title')).toHaveText('Persisted task');
});

test('a task completed yesterday archives after opening the app today', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-03-04T10:00:00') });
  await page.goto('/');

  await page.click('#do-add-button');
  await page.fill('#do-add-input', 'Yesterday task');
  await page.keyboard.press('Enter');
  await page.locator('#do-list li .task-checkbox').check();
  await expect(page.locator('#do-list li')).toHaveCount(1);

  // Move to "today": local midnight has passed.
  await page.clock.setFixedTime(new Date('2026-03-05T09:00:00'));
  await page.reload();

  await expect(page.locator('#do-list li')).toHaveCount(0);
  await expect(page.locator('#do-completed-toggle')).toBeVisible();
  await expect(page.locator('#do-completed-toggle')).toHaveText('Completed (1)');
  await expect(page.locator('#do-completed-toggle')).toHaveAttribute('aria-expanded', 'false');

  await page.click('#do-completed-toggle');
  await expect(page.locator('#do-archived-list li')).toHaveCount(1);
  await expect(page.locator('#do-completed-toggle')).toHaveAttribute('aria-expanded', 'true');

  await page.click('#do-completed-toggle');
  await expect(page.locator('#do-archived-list')).toBeHidden();

  // Restore: unchecking an archived task puts it back at the end of the open list.
  await page.click('#do-completed-toggle');
  await page.locator('#do-archived-list li .task-checkbox').uncheck();
  await expect(page.locator('#do-list li')).toHaveCount(1);
  await expect(page.locator('#do-completed-toggle')).toBeHidden();
});

test('corrupt stored data shows a notice and starts with an empty board', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('decision-matrix:data', '{not valid json');
  });
  await page.goto('/');

  await expect(page.locator('.banner')).toContainText('backup');
  await expect(page.locator('#do-list li')).toHaveCount(0);

  // A backup key should now exist.
  const hasBackup = await page.evaluate(() =>
    Object.keys(window.localStorage).some((k) => k.startsWith('decision-matrix:backup-')),
  );
  expect(hasBackup).toBe(true);
});

test('two tabs stay in sync', async ({ context }) => {
  const pageA = await context.newPage();
  const pageB = await context.newPage();

  await pageA.goto('/');
  await pageB.goto('/');

  await pageA.click('#do-add-button');
  await pageA.fill('#do-add-input', 'Cross-tab task');
  await pageA.keyboard.press('Enter');

  await expect(pageB.locator('#do-list li .task-title')).toHaveText('Cross-tab task');
});
