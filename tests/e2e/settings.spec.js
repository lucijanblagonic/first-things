import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 1280, height: 800 } });

/** @param {import('@playwright/test').Page} page */
async function addDoTask(page, title) {
  await page.click('#do-add-button');
  await page.fill('#do-add-input', title);
  await page.keyboard.press('Enter');
  await page.keyboard.press('Escape');
}

test('settings button opens a dialog with Layout, Keyboard and Shortcuts sections', async ({ page }) => {
  await page.goto('/');
  await page.click('#settings-button');
  const dialog = page.locator('#settings-dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('heading', { level: 2 })).toHaveText('Settings');
  await expect(dialog.locator('h3')).toHaveText(['Layout', 'Keyboard', 'Shortcuts']);
  await expect(dialog.locator('.shortcut-group h4')).toHaveText(['Navigate', 'Tasks', 'App']);
  // Focus starts on the selected layout option.
  await expect(page.locator('input[name="layout"][value="urgent-right"]')).toBeFocused();
});

test('choosing "Left" swaps the board immediately and persists', async ({ page }) => {
  await page.goto('/');
  await page.click('#settings-button');
  await page.getByLabel(/Left/).check();

  await expect(page.locator('html')).toHaveAttribute('data-layout', 'urgent-left');
  await page.click('#settings-close-button');
  let doBox = await page.locator('#quadrant-do').boundingBox();
  let planBox = await page.locator('#quadrant-plan').boundingBox();
  expect(doBox.x).toBeLessThan(planBox.x);

  await page.reload();
  doBox = await page.locator('#quadrant-do').boundingBox();
  planBox = await page.locator('#quadrant-plan').boundingBox();
  expect(doBox.x).toBeLessThan(planBox.x);

  await page.click('#settings-button');
  await expect(page.locator('input[name="layout"][value="urgent-left"]')).toBeChecked();
  await page.getByLabel(/Right/).check();
  await expect(page.locator('html')).not.toHaveAttribute('data-layout', /.+/);
});

test('single-key toggle lives in Settings and persists', async ({ page }) => {
  await page.goto('/');
  await page.click('#settings-button');
  await page.uncheck('#single-key-shortcuts-toggle');
  await page.click('#settings-close-button');
  await page.reload();
  await page.click('#settings-button');
  await expect(page.locator('#single-key-shortcuts-toggle')).not.toBeChecked();
});

test('Escape, × and backdrop click close Settings and return focus', async ({ page }) => {
  await page.goto('/');
  await addDoTask(page, 'Focus me');
  const task = page.locator('#do-list li').first();
  const dialog = page.locator('#settings-dialog');

  await task.focus();
  await page.keyboard.press('?');
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(task).toBeFocused();

  await page.keyboard.press('?');
  await page.click('#settings-close-button');
  await expect(dialog).toBeHidden();
  await expect(task).toBeFocused();

  await page.keyboard.press('?');
  await page.mouse.click(10, 790); // backdrop, outside the dialog box
  await expect(dialog).toBeHidden();
  await expect(task).toBeFocused();
});

test('Mod+Comma opens Settings from a task, from the add input, and with single keys off', async ({ page }) => {
  await page.goto('/');
  await addDoTask(page, 'Task');
  const dialog = page.locator('#settings-dialog');

  for (const combo of ['Control+Comma', 'Meta+Comma']) {
    await page.locator('#do-list li').first().focus();
    await page.keyboard.press(combo);
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  }

  await page.click('#do-add-button');
  await page.keyboard.press('Control+Comma');
  await expect(dialog).toBeVisible();
  await page.uncheck('#single-key-shortcuts-toggle');
  await page.keyboard.press('Escape');

  await page.locator('#do-list li').first().focus();
  await page.keyboard.press('?');
  await expect(dialog).toBeHidden();
  await page.keyboard.press('Control+Comma');
  await expect(dialog).toBeVisible();
});

test('no horizontal overflow at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('/');
  await page.click('#settings-button');
  const overflow = await page.evaluate(() => {
    const d = document.getElementById('settings-dialog');
    return {
      dialog: d.scrollWidth - d.clientWidth,
      page: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });
  expect(overflow.dialog).toBeLessThanOrEqual(0);
  expect(overflow.page).toBeLessThanOrEqual(0);
});
