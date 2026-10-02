import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 1280, height: 800 } });

test('header: large h1 title, no border, two icon buttons', async ({ page }) => {
  await page.goto('/');
  const title = page.locator('h1');
  await expect(title).toHaveText('Decision Matrix');

  const sizes = await page.evaluate(() => ({
    title: parseFloat(getComputedStyle(document.querySelector('h1')).fontSize),
    quadrant: parseFloat(getComputedStyle(document.querySelector('.quadrant-title')).fontSize),
    border: getComputedStyle(document.querySelector('.app-header')).borderBottomWidth,
  }));
  expect(sizes.title).toBeGreaterThan(sizes.quadrant);
  expect(sizes.border).toBe('0px');

  for (const id of ['#theme-button', '#settings-button']) {
    const box = await page.locator(id).boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(32);
    expect(box?.height).toBeGreaterThanOrEqual(32);
  }
  await expect(page.locator('#settings-button')).toHaveAccessibleName('Settings');
  await expect(page.locator('#theme-button')).toHaveAccessibleName('Theme: System');
});

test('tooltip shows on hover', async ({ page }) => {
  await page.goto('/');
  const tooltip = page.locator('#theme-button + .tooltip');
  await expect(tooltip).toBeHidden();
  await page.locator('#theme-button').hover();
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toHaveText('Theme: System');
  // Hoverable: moving onto the tooltip keeps it open.
  await tooltip.hover();
  await expect(tooltip).toBeVisible();
});

test('tooltip shows on keyboard focus and Escape hides it without moving focus', async ({ page }) => {
  await page.goto('/');
  const button = page.locator('#settings-button');
  const tooltip = page.locator('#settings-button + .tooltip');

  // Focus right after a key press so :focus-visible applies. (Not via Tab:
  // WebKit skips buttons in Tab order without Full Keyboard Access.)
  await page.locator('body').click();
  await page.keyboard.press('Shift');
  await button.focus();
  await expect(button).toBeFocused();
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toContainText('Settings');
  await expect(tooltip.locator('.kbd').first()).toHaveText('?');

  await page.keyboard.press('Escape');
  await expect(tooltip).toBeHidden();
  await expect(button).toBeFocused();
});
