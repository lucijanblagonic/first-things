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

test('task rows, the add button label and the heading share a left edge', async ({ page }) => {
  await page.goto('/');
  await addTask(page, 'plan', 'Aligned');
  const left = (/** @type {string} */ selector) =>
    page.locator(selector).evaluate((el) => {
      const style = getComputedStyle(el);
      return el.getBoundingClientRect().left + parseFloat(style.paddingLeft) + parseFloat(style.borderLeftWidth);
    });
  const subtitle = await left('#plan-subtitle');
  const checkbox = (await page.locator('#plan-list li input[type="checkbox"]').boundingBox())?.x ?? -1;
  const addLabel = await left('#plan-add-button');
  expect(Math.abs(checkbox - subtitle)).toBeLessThanOrEqual(1);
  expect(Math.abs(addLabel - subtitle)).toBeLessThanOrEqual(1);
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
