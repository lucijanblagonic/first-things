import { test, expect } from '@playwright/test';

test('default theme follows the emulated OS color scheme', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');

  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  // Dark tokens.css background is rgb(20, 20, 20).
  expect(bg).toBe('rgb(20, 20, 20)');
  await expect(page.locator('#theme-button')).toHaveAccessibleName('Theme: System');
  await expect(page.locator('#theme-button')).toHaveAttribute('data-pref', 'system');
});

test('cycle button changes the theme and its accessible name', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');

  await expect(page.locator('#theme-button')).toHaveAccessibleName('Theme: System');
  await expect(page.locator('#theme-button')).toHaveAttribute('data-pref', 'system');

  await page.click('#theme-button');
  await expect(page.locator('#theme-button')).toHaveAccessibleName('Theme: Light');
  await expect(page.locator('#theme-button')).toHaveAttribute('data-pref', 'light');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

  await page.click('#theme-button');
  await expect(page.locator('#theme-button')).toHaveAccessibleName('Theme: Dark');
  await expect(page.locator('#theme-button')).toHaveAttribute('data-pref', 'dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(bg).toBe('rgb(20, 20, 20)');

  await page.click('#theme-button');
  await expect(page.locator('#theme-button')).toHaveAccessibleName('Theme: System');
  await expect(page.locator('#theme-button')).toHaveAttribute('data-pref', 'system');
  await expect(page.locator('html')).not.toHaveAttribute('data-theme', /.+/);
});

test('manual override wins over the OS setting', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  await page.click('#theme-button'); // -> Light
  await expect(page.locator('#theme-button')).toHaveAccessibleName('Theme: Light');
  await expect(page.locator('#theme-button')).toHaveAttribute('data-pref', 'light');
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  // Light tokens.css background is rgb(245, 245, 245).
  expect(bg).toBe('rgb(245, 245, 245)');
});

test('theme preference persists across reload', async ({ page }) => {
  await page.goto('/');
  await page.click('#theme-button'); // System -> Light
  await page.click('#theme-button'); // Light -> Dark
  await expect(page.locator('#theme-button')).toHaveAccessibleName('Theme: Dark');
  await expect(page.locator('#theme-button')).toHaveAttribute('data-pref', 'dark');

  await page.reload();
  await expect(page.locator('#theme-button')).toHaveAccessibleName('Theme: Dark');
  await expect(page.locator('#theme-button')).toHaveAttribute('data-pref', 'dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('a Dark preference renders dark on first paint even on a light OS, before main.js runs', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.addInitScript(() => {
    window.localStorage.setItem('decision-matrix:theme', 'dark');
  });

  await page.goto('/', { waitUntil: 'commit' });
  // Evaluate immediately after the document starts loading, before any
  // deferred/module script (main.js) has necessarily run, to catch the
  // inline head script's effect specifically.
  const dataTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  expect(dataTheme).toBe('dark');

  await page.waitForLoadState('domcontentloaded');
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(bg).toBe('rgb(20, 20, 20)');
});

test('theme button shows the icon for the current preference and an updated tooltip', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  const button = page.locator('#theme-button');
  const tooltip = page.locator('#theme-tooltip-text');

  await expect(button.locator('.icon-monitor')).toBeVisible();
  await expect(button.locator('.icon-sun')).toBeHidden();
  await expect(tooltip).toHaveText('Theme: System');

  await button.click();
  await expect(button.locator('.icon-sun')).toBeVisible();
  await expect(button.locator('.icon-monitor')).toBeHidden();
  await expect(tooltip).toHaveText('Theme: Light');

  await button.click();
  await expect(button.locator('.icon-moon')).toBeVisible();
  await expect(tooltip).toHaveText('Theme: Dark');
  await expect(page.locator('#live-region')).toHaveText('Theme: Dark');
});
