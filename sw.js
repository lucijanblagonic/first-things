/**
 * Service worker: makes the app load without a network connection after the
 * first visit. Network-first, so an online load always gets the deployed
 * version; the cache is only the offline fallback. Never touches task data
 * (that lives in localStorage).
 */

// Bump when the precache list changes shape and old entries should be dropped.
const CACHE_NAME = 'decision-matrix-v1';

// Hand-maintained (there is no build step). tests/unit/sw-precache.test.js
// fails if this list and the files on disk drift apart.
const PRECACHE_URLS = [
  './',
  'index.html',
  'manifest.webmanifest',
  'icons/apple-touch-icon.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'icons/icon-maskable.svg',
  'icons/icon.svg',
  'src/core/actions.js',
  'src/core/dates.js',
  'src/core/demo.js',
  'src/core/quadrants.js',
  'src/core/schema.js',
  'src/core/selectors.js',
  'src/core/storage/adapter.js',
  'src/core/storage/local-storage.js',
  'src/core/storage/memory.js',
  'src/core/store.js',
  'src/core/task.js',
  'src/core/transfer.js',
  'src/main.js',
  'src/ui/announcer.js',
  'src/ui/data-transfer.js',
  'src/ui/dialogs.js',
  'src/ui/dnd.js',
  'src/ui/focus.js',
  'src/ui/keyboard.js',
  'src/ui/render.js',
  'src/ui/settings.js',
  'src/ui/task-item.js',
  'src/ui/theme.js',
  'src/ui/toast.js',
  'src/ui/tooltip.js',
  'styles/base.css',
  'styles/board.css',
  'styles/dialog.css',
  'styles/kbd.css',
  'styles/task.css',
  'styles/tokens.css',
  'styles/tooltip.css',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      // 'reload' bypasses the HTTP cache so a stale copy is never precached.
      .then((cache) => cache.addAll(PRECACHE_URLS.map((url) => new Request(url, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    (async () => {
      try {
        // 'no-cache' revalidates with the server, so a new deploy shows up on
        // the next online load despite the host's cache headers.
        const response = await fetch(request, { cache: 'no-cache' });
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, response.clone());
        }
        return response;
      } catch {
        const cached = await caches.match(request, { ignoreSearch: true });
        if (cached) return cached;
        if (request.mode === 'navigate') {
          const shell = await caches.match('index.html');
          if (shell) return shell;
        }
        return Response.error();
      }
    })(),
  );
});
