import { test, expect } from '@playwright/test';

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
const focusColor = (page) =>
  page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--color-focus').trim());

test('header shows the logo next to the app name', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('First Things');
  await expect(page.locator('h1')).toHaveText('First Things');
  await expect(page.locator('h1 .app-logo')).toBeVisible();
  await expect(page.locator('h1 .app-logo')).toHaveAttribute('aria-hidden', 'true');
});

test('the focus ring on a task row is not clipped by its list', async ({ page }) => {
  await page.goto('/');
  await addTask(page, 'do', 'Ring check');
  await page.keyboard.press('1');
  const row = page.locator('#do-list li').first();
  await expect(row).toBeFocused();

  const fits = await row.evaluate((li) => {
    const style = getComputedStyle(li);
    const reach = parseFloat(style.outlineOffset) + parseFloat(style.outlineWidth);
    const rowBox = li.getBoundingClientRect();
    const listBox = /** @type {HTMLElement} */ (li.parentElement).getBoundingClientRect();
    return {
      width: parseFloat(style.outlineWidth),
      left: rowBox.left - reach >= listBox.left,
      right: rowBox.right + reach <= listBox.right,
    };
  });
  expect(fits.width).toBeGreaterThanOrEqual(2);
  expect(fits.left).toBe(true);
  expect(fits.right).toBe(true);
});

test('task rows and the add button share the heading\'s left edge', async ({ page }) => {
  await page.goto('/');
  await addTask(page, 'plan', 'Aligned');
  const subtitle = (await page.locator('#plan-subtitle').boundingBox())?.x ?? -1;
  const checkbox = (await page.locator('#plan-list li input[type="checkbox"]').boundingBox())?.x ?? -2;
  const addButton = (await page.locator('#plan-add-button').boundingBox())?.x ?? -3;
  expect(Math.abs(checkbox - subtitle)).toBeLessThanOrEqual(1);
  expect(Math.abs(addButton - subtitle)).toBeLessThanOrEqual(1);
});

test('the add form is one line that takes the place of the add button', async ({ page }) => {
  await page.goto('/');
  const button = await page.locator('#do-add-button').boundingBox();
  const headingBefore = await page.locator('#do-heading').boundingBox();
  await page.click('#do-add-button');

  const input = await page.locator('#do-add-input').boundingBox();
  const submit = await page.locator('#do-add-form button[type="submit"]').boundingBox();
  const cancel = await page.locator('#do-add-cancel').boundingBox();
  if (!button || !input || !submit || !cancel) throw new Error('add form controls are not rendered');

  // Same line, same height, same place as the button it replaced.
  for (const box of [input, submit, cancel]) {
    expect(box.y).toBe(button.y);
    expect(box.height).toBe(button.height);
  }
  expect(input.x).toBe(button.x);
  expect(submit.x).toBeGreaterThan(input.x + input.width);
  expect(cancel.x).toBeGreaterThan(submit.x + submit.width);
  // Nothing above it moved.
  expect((await page.locator('#do-heading').boundingBox())?.y).toBe(headingBefore?.y);

  // The validation message goes on its own line below the controls, which
  // stay on one line.
  await page.keyboard.press('Enter');
  await expect(page.locator('#do-add-error')).toBeVisible();
  const error = await page.locator('#do-add-error').boundingBox();
  const inputWithError = await page.locator('#do-add-input').boundingBox();
  const cancelWithError = await page.locator('#do-add-cancel').boundingBox();
  if (!error || !inputWithError || !cancelWithError) throw new Error('add form controls are not rendered');
  expect(error.y).toBeGreaterThanOrEqual(inputWithError.y + inputWithError.height);
  expect(cancelWithError.y).toBe(inputWithError.y);
});

test('the add form still fits on one line at phone width', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 700 });
  await page.goto('/');
  await page.click('#do-add-button');
  const input = await page.locator('#do-add-input').boundingBox();
  const cancel = await page.locator('#do-add-cancel').boundingBox();
  expect(cancel?.y).toBe(input?.y);
  expect(input?.width).toBeGreaterThanOrEqual(96);
});

test('a task moved with the keyboard is briefly highlighted where it lands', async ({ page }) => {
  await page.goto('/');
  await addTask(page, 'do', 'First');
  await addTask(page, 'do', 'Second');
  await page.keyboard.press('1');
  await expect(page.locator('#do-list li').first()).toBeFocused();

  const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
  await page.keyboard.press(`${modifier}+ArrowDown`);
  const moved = page.locator('#do-list li', { hasText: 'First' });
  await expect(page.locator('#do-list li .task-title')).toHaveText(['Second', 'First']);
  await expect(moved).toHaveClass(/task-moved/);
  await expect(moved).toBeFocused();

  // At the bottom edge nothing moves, so nothing is highlighted.
  await page.keyboard.press(`${modifier}+ArrowDown`);
  await expect(page.locator('#do-list li .task-title')).toHaveText(['Second', 'First']);
  await expect(page.locator('#do-list li', { hasText: 'First' })).not.toHaveClass(/task-moved/);

  // Moving to another quadrant highlights it there.
  await page.keyboard.press('Shift+2');
  await expect(page.locator('#plan-list li', { hasText: 'First' })).toHaveClass(/task-moved/);
});

test('dragging shows where the task will land without shifting the rows', async ({ page }) => {
  await page.goto('/');
  await addTask(page, 'do', 'A');
  await addTask(page, 'do', 'B');
  await addTask(page, 'do', 'C');
  const tops = () =>
    page.locator('#do-list li').evaluateAll((items) => items.map((li) => li.getBoundingClientRect().top));
  const before = await tops();

  const dataTransfer = await page.evaluateHandle(() => new DataTransfer());
  await page.locator('#do-list li', { hasText: 'C' }).dispatchEvent('dragstart', { dataTransfer });
  await expect(page.locator('#do-list li', { hasText: 'C' })).toHaveClass(/task-dragging/);

  // Hover just below the top of B: C would land between A and B.
  const b = await page.locator('#do-list li', { hasText: 'B' }).boundingBox();
  if (!b) throw new Error('row B is not rendered');
  await page
    .locator('#quadrant-do')
    .dispatchEvent('dragover', { dataTransfer, clientX: b.x + 40, clientY: b.y + 3 });

  const line = page.locator('#do-list .drop-insertion-line');
  await expect(line).toHaveCount(1);
  await expect(page.locator('#quadrant-do')).toHaveClass(/quadrant-drag-over/);
  const order = await page
    .locator('#do-list > *')
    .evaluateAll((nodes) => nodes.map((node) => (node.matches('li') ? node.textContent?.trim()[0] : '|')));
  expect(order).toEqual(['A', '|', 'B', 'C']);

  // The bar is drawn (3px tall, spanning the row) but takes no room.
  const bar = await line.evaluate((el) => {
    const style = getComputedStyle(el, '::before');
    return { height: parseFloat(style.height), width: parseFloat(style.width) };
  });
  expect(bar.height).toBeGreaterThanOrEqual(3);
  expect(bar.width).toBeGreaterThan(100);
  expect(await tops()).toEqual(before);

  await page.locator('#do-list li', { hasText: 'C' }).dispatchEvent('dragend', { dataTransfer });
  await expect(line).toHaveCount(0);
  await expect(page.locator('#quadrant-do')).not.toHaveClass(/quadrant-drag-over/);
});

test('Do is emphasised without shifting its content relative to its neighbour', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  const doTop = (await page.locator('#do-heading').boundingBox())?.y;
  const planTop = (await page.locator('#plan-heading').boundingBox())?.y;
  expect(doTop).toBe(planTop);
  const widths = await page.evaluate(() =>
    ['#quadrant-do', '#quadrant-plan'].map((s) => getComputedStyle(document.querySelector(s)).borderTopWidth),
  );
  expect(widths[0]).toBe(widths[1]);
});

test('the add button has no border by default and an outline in high contrast', async ({ page }) => {
  await page.goto('/');
  const borderColor = () =>
    page.locator('#do-add-button').evaluate((el) => getComputedStyle(el).borderTopColor);
  expect(await borderColor()).toMatch(/rgba\(0, 0, 0, 0\)|transparent/);
  expect(await page.locator('#do-add-button').evaluate((el) => getComputedStyle(el).borderTopStyle)).not.toBe(
    'dashed',
  );

  await page.click('#settings-button');
  await page.check('#high-contrast-toggle');
  await page.click('#settings-close-button');
  expect(await borderColor()).not.toMatch(/rgba\(0, 0, 0, 0\)|transparent/);
});

test('high contrast is off by default, can be turned on, and persists', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).not.toHaveAttribute('data-contrast', /.*/);
  const softFocus = await focusColor(page);

  await page.click('#settings-button');
  await expect(page.locator('#high-contrast-toggle')).not.toBeChecked();
  await page.check('#high-contrast-toggle');
  await expect(page.locator('html')).toHaveAttribute('data-contrast', 'high');
  await expect(page.locator('#live-region')).toHaveText('High contrast on');
  expect(await focusColor(page)).not.toBe(softFocus);

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-contrast', 'high');
  await page.click('#settings-button');
  await expect(page.locator('#high-contrast-toggle')).toBeChecked();

  await page.uncheck('#high-contrast-toggle');
  await expect(page.locator('html')).not.toHaveAttribute('data-contrast', /.*/);
  await page.reload();
  await expect(page.locator('html')).not.toHaveAttribute('data-contrast', /.*/);
});

test('high contrast follows the OS preference until the user chooses', async ({ page }) => {
  await page.emulateMedia({ contrast: 'more' });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-contrast', 'high');

  // An explicit "off" wins over the OS preference, also after a reload.
  await page.click('#settings-button');
  await expect(page.locator('#high-contrast-toggle')).toBeChecked();
  await page.uncheck('#high-contrast-toggle');
  await page.reload();
  await expect(page.locator('html')).not.toHaveAttribute('data-contrast', /.*/);
});

test('checkboxes show their state in both themes', async ({ page }) => {
  for (const colorScheme of /** @type {const} */ (['light', 'dark'])) {
    await page.emulateMedia({ colorScheme });
    await page.goto('/');
    await addTask(page, 'do', `Tick me (${colorScheme})`);
    const box = page.locator('#do-list li input[type="checkbox"]').first();
    const background = () => box.evaluate((el) => getComputedStyle(el).backgroundColor);
    const before = await background();
    await box.check();
    await expect(box).toBeChecked();
    expect(await background()).not.toBe(before);
    await box.uncheck();
  }
});
