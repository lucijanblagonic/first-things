/**
 * Renders the PNG app icons in icons/ from their SVG sources. Dev-only: run
 * with `node scripts/render-icons.mjs` after editing an SVG and commit the
 * output. Not part of any build or CI step.
 */

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { chromium } from '@playwright/test';

const ICONS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'icons');

const RENDERS = [
  { source: 'icon.svg', output: 'icon-192.png', size: 192 },
  { source: 'icon.svg', output: 'icon-512.png', size: 512 },
  { source: 'icon.svg', output: 'apple-touch-icon.png', size: 180 },
  { source: 'icon-maskable.svg', output: 'icon-maskable-512.png', size: 512 },
];

const browser = await chromium.launch();
try {
  for (const { source, output, size } of RENDERS) {
    const svg = await readFile(path.join(ICONS_DIR, source));
    const dataUri = `data:image/svg+xml;base64,${svg.toString('base64')}`;
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    await page.setContent(
      `<style>html,body{margin:0;background:transparent}img{display:block;width:${size}px;height:${size}px}</style><img src="${dataUri}">`,
    );
    await page.locator('img').evaluate((img) => /** @type {HTMLImageElement} */ (img).decode());
    await page.screenshot({ path: path.join(ICONS_DIR, output), omitBackground: true });
    await page.close();
    console.log(`${output} (${size}x${size})`);
  }
} finally {
  await browser.close();
}
