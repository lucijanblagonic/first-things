import { test, expect } from '@playwright/test';

/** @param {import('@playwright/test').Page} page */
async function addTask(page, quadrantId, title) {
  await page.click(`#${quadrantId}-add-button`);
  await page.fill(`#${quadrantId}-add-input`, title);
  await page.keyboard.press('Enter');
  await page.keyboard.press('Escape'); // close the (still-open) add form, focus returns to Add button
}

test('full keyboard-only flow', async ({ page }) => {
  await page.goto('/');

  // Seed one task in Do via the add-input flow (keyboard: n opens, type, Enter).
  await page.locator('body').click(); // ensure page has focus, nothing else focused
  await page.keyboard.press('1'); // focus Do (empty -> add button)
  await expect(page.locator('#do-add-button')).toBeFocused();
  await page.keyboard.press('n');
  await expect(page.locator('#do-add-form')).toBeVisible();
  await page.keyboard.type('First task');
  await page.keyboard.press('Enter');
  await expect(page.locator('#do-list li')).toHaveCount(1);
  await page.keyboard.press('Escape');
  await expect(page.locator('#do-add-button')).toBeFocused();

  // 1-4 jump: task now exists, so '1' should focus the task itself.
  await page.keyboard.press('1');
  await expect(page.locator('#do-list li')).toBeFocused();

  // Add a second task so arrow/jk navigation has something to move between.
  await addTask(page, 'do', 'Second task');
  await page.keyboard.press('1');
  await expect(page.locator('#do-list li').first()).toBeFocused();

  // ArrowDown / j moves to next task.
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('#do-list li').nth(1)).toBeFocused();
  await page.keyboard.press('k'); // k moves back up
  await expect(page.locator('#do-list li').first()).toBeFocused();
  await page.keyboard.press('j');
  await expect(page.locator('#do-list li').nth(1)).toBeFocused();

  // h/l and arrow spatial navigation: Do (top-right) <-> Plan (top-left).
  // '1' jumps to Do's *remembered* task — the last 'j' press above left
  // that remembered task on the second row, so that's what comes back into
  // focus here and after each round trip through Plan (spec: quadrants
  // remember their last-focused task).
  await page.keyboard.press('1');
  await expect(page.locator('#do-list li').nth(1)).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('#plan-add-button')).toBeFocused(); // Plan has no tasks yet
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#do-list li').nth(1)).toBeFocused();
  await page.keyboard.press('h');
  await expect(page.locator('#plan-add-button')).toBeFocused();
  await page.keyboard.press('l');
  await expect(page.locator('#do-list li').nth(1)).toBeFocused();

  // Enter opens the edit dialog for the focused task. From here on, track
  // the focused task by id (rather than list position) since "remembered
  // last-focused task" makes position-based assertions fragile.
  const focusedId = await page.evaluate(() => document.activeElement?.getAttribute('data-id'));
  const focused = page.locator(`li[data-id="${focusedId}"]`);

  await page.keyboard.press('Enter');
  await expect(page.locator('#edit-dialog')).toBeVisible();
  await expect(page.locator('#edit-title')).toHaveValue('Second task');
  await page.keyboard.press('Escape');
  await expect(page.locator('#edit-dialog')).toBeHidden();
  await expect(focused).toBeFocused();

  // x toggles completion.
  await page.keyboard.press('x');
  await expect(focused).toHaveClass(/task-item-completed/);
  await page.keyboard.press('x');
  await expect(focused).not.toHaveClass(/task-item-completed/);

  // Backspace deletes with undo; Ctrl+Z restores it.
  await page.keyboard.press('Backspace');
  await expect(page.locator('#do-list li')).toHaveCount(1);
  await page.keyboard.press('Control+z');
  await expect(page.locator('#do-list li')).toHaveCount(2);
  await expect(focused).toBeFocused();

  // Ctrl+ArrowDown reorders the focused task down, keeping focus on it.
  await page.keyboard.press('Control+ArrowDown');
  await expect(focused).toBeFocused();

  // Ctrl+ArrowLeft moves the focused task to Plan, keeping focus on it.
  await page.keyboard.press('Control+ArrowLeft');
  await expect(page.locator('#plan-list li')).toHaveCount(1);
  await expect(focused).toBeFocused();

  // Shift+1 moves the focused task to Do (appended to the end).
  await page.keyboard.press('Shift+1');
  await expect(page.locator('#do-list li')).toHaveCount(2);
  await expect(page.locator('#plan-list li')).toHaveCount(0);

  // ? opens Settings.
  await page.keyboard.press('?');
  await expect(page.locator('#settings-dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#settings-dialog')).toBeHidden();
});

test('shortcuts are ignored while typing in the add input', async ({ page }) => {
  await page.goto('/');
  await page.click('#do-add-button');
  await page.fill('#do-add-input', 'x');
  await expect(page.locator('#do-list li')).toHaveCount(0);
  await expect(page.locator('#do-add-input')).toHaveValue('x');
});

test('single-key shortcuts toggle off persists across reload and disables single-key shortcuts', async ({
  page,
}) => {
  await page.goto('/');
  await page.click('#do-add-button');
  await page.fill('#do-add-input', 'Task A');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Escape');

  await page.keyboard.press('?');
  await page.uncheck('#single-key-shortcuts-toggle');
  await page.click('#settings-close-button');

  await expect.poll(() => page.evaluate(() => window.localStorage.getItem('decision-matrix:shortcuts'))).toBe(
    'off',
  );

  await page.keyboard.press('1');
  await page.locator('#do-list li').first().focus();
  await page.keyboard.press('x'); // single-key shortcut, should now be a no-op
  await expect(page.locator('#do-list li').first()).not.toHaveClass(/task-item-completed/);

  // Arrow keys (exempt from the toggle) still work.
  await page.keyboard.press('Space'); // Space is exempt, still toggles completion
  await expect(page.locator('#do-list li').first()).toHaveClass(/task-item-completed/);

  await page.reload();
  await page.keyboard.press('?');
  await expect(page.locator('#single-key-shortcuts-toggle')).not.toBeChecked();
});

test('Tab order visits header controls then each quadrant in priority order', async ({ page, browserName }) => {
  // WebKit only includes <button> elements in the Tab sequence when the OS
  // "Full Keyboard Access" preference is on (true of real Safari, too) — not
  // an app bug, so this Tab-order assertion is scoped to browsers that tab
  // to buttons by default.
  test.skip(browserName === 'webkit', 'WebKit excludes <button> from Tab order without Full Keyboard Access');

  await page.goto('/');

  await page.locator('#theme-button').focus();
  await expect(page.locator('#theme-button')).toBeFocused();

  await page.keyboard.press('Tab');
  await expect(page.locator('#settings-button')).toBeFocused();

  await page.keyboard.press('Tab');
  await expect(page.locator('#do-add-button')).toBeFocused();

  await page.keyboard.press('Tab');
  await expect(page.locator('#plan-add-button')).toBeFocused();

  await page.keyboard.press('Tab');
  await expect(page.locator('#limit-add-button')).toBeFocused();

  await page.keyboard.press('Tab');
  await expect(page.locator('#drop-add-button')).toBeFocused();
});
