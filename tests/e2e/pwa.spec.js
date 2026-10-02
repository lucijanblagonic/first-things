import { test, expect } from '@playwright/test';

// playwright.config.js blocks service workers for every other spec; this one
// is about the service worker, so it opts back in.
test.use({ serviceWorkers: 'allow' });

const CACHE_NAME = 'decision-matrix-v1';

/**
 * Loads the app and waits until the service worker is active and controls
 * the page (which needs one reload after the first install).
 * @param {import('@playwright/test').Page} page
 */
async function gotoControlled(page) {
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await page.reload();
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);
}

test('manifest is linked and valid', async ({ page }) => {
  await page.goto('/');
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(href).toBeTruthy();
  const manifestUrl = new URL(/** @type {string} */ (href), page.url());

  const response = await page.request.get(manifestUrl.href);
  expect(response.status()).toBe(200);
  const manifest = await response.json();

  expect(manifest.name).toBe('Decision Matrix');
  expect(manifest.short_name).toBeTruthy();
  expect(manifest.display).toBe('standalone');
  expect(manifest.start_url).toBe('.');

  const sizes = manifest.icons.map((/** @type {{ sizes: string }} */ icon) => icon.sizes);
  expect(sizes).toContain('192x192');
  expect(sizes).toContain('512x512');
  expect(manifest.icons.some((/** @type {{ purpose?: string }} */ icon) => icon.purpose === 'maskable')).toBe(true);

  for (const icon of manifest.icons) {
    const iconResponse = await page.request.get(new URL(icon.src, manifestUrl).href);
    expect(iconResponse.status(), icon.src).toBe(200);
  }
});

test('page links a favicon and an apple touch icon that load', async ({ page }) => {
  await page.goto('/');
  for (const selector of ['link[rel="icon"]', 'link[rel="apple-touch-icon"]']) {
    const href = await page.locator(selector).getAttribute('href');
    const response = await page.request.get(new URL(/** @type {string} */ (href), page.url()).href);
    expect(response.status(), selector).toBe(200);
  }
});

test('service worker registers and controls the page', async ({ page }) => {
  await page.goto('/');
  test.skip(
    !(await page.evaluate(() => 'serviceWorker' in navigator)),
    'this browser build has no service worker support',
  );
  await gotoControlled(page);
});

test('works offline after the first visit', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'offline emulation with service workers is only reliable in Chromium');

  await gotoControlled(page);
  await page.click('#do-add-button');
  await page.fill('#do-add-input', 'Saved before going offline');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Escape');

  await context.setOffline(true);
  await page.reload();

  await expect(page.locator('section.quadrant')).toHaveCount(4);
  for (const id of ['do', 'plan', 'limit', 'drop']) {
    await expect(page.locator(`#quadrant-${id}`)).toBeVisible();
  }
  await expect(page.locator('#do-list li .task-title')).toHaveText('Saved before going offline');

  await page.click('#plan-add-button');
  await page.fill('#plan-add-input', 'Added while offline');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Escape');
  await page.reload();

  await expect(page.locator('#do-list li .task-title')).toHaveText('Saved before going offline');
  await expect(page.locator('#plan-list li .task-title')).toHaveText('Added while offline');
});

test('a changed file is served on the next online load', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'cache inspection with service workers is only reliable in Chromium');

  await gotoControlled(page);

  // Simulate a cache left over from an older deploy.
  await page.evaluate(async (cacheName) => {
    const cache = await caches.open(cacheName);
    await cache.put('styles/base.css', new Response('/* stale */', { headers: { 'Content-Type': 'text/css' } }));
  }, CACHE_NAME);

  // A fetch from the page goes through the service worker: online, it must
  // return the server's copy, not the stale cached one...
  const served = await page.evaluate(() => fetch('styles/base.css').then((response) => response.text()));
  expect(served).not.toBe('/* stale */');
  expect(served.length).toBeGreaterThan(20);

  // ...and refresh the cache with it.
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const cached = await caches.match('styles/base.css');
        return cached ? cached.text() : null;
      }),
    )
    .toBe(served);
});
