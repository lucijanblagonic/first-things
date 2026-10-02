import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const PRECACHED_DIRS = ['src', 'styles', 'icons'];

/** @returns {string[]} the string literals in sw.js's PRECACHE_URLS array */
function readPrecacheList() {
  const source = readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  const start = source.indexOf('const PRECACHE_URLS = [');
  assert.notEqual(start, -1, 'sw.js must declare PRECACHE_URLS');
  const body = source.slice(start, source.indexOf('];', start));
  return [...body.matchAll(/'([^']+)'/g)].map((match) => match[1]);
}

/**
 * @param {string} dir repo-relative directory
 * @returns {string[]} repo-relative, forward-slash paths of every file below it
 */
function listFiles(dir) {
  return readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap((entry) => {
    const relative = `${dir}/${entry.name}`;
    return entry.isDirectory() ? listFiles(relative) : [relative];
  });
}

test('every file the app serves is in the service worker precache list', () => {
  const precached = new Set(readPrecacheList());
  const missing = PRECACHED_DIRS.flatMap(listFiles).filter((file) => !precached.has(file));
  assert.deepEqual(missing, [], 'add these files to PRECACHE_URLS in sw.js');
});

test('every precached path exists on disk', () => {
  const stale = readPrecacheList().filter((url) => url !== './' && !existsSync(path.join(ROOT, url)));
  assert.deepEqual(stale, [], 'remove these entries from PRECACHE_URLS in sw.js');
});

test('the app shell entries are precached', () => {
  const precached = readPrecacheList();
  for (const url of ['./', 'index.html', 'manifest.webmanifest']) {
    assert.ok(precached.includes(url), `${url} must be precached`);
  }
});
