# Design

## Context

See `proposal.md` for motivation. Current state that shapes the approach:

- The app is a static site with native ES modules and **no build step**
  (`openspec/config.yaml`): 22 files under `src/`, 7 under `styles/`, plus
  `index.html`. All asset references in `index.html` are already relative.
- `.github/workflows/pages.yml` assembles `_site` from `index.html`, `src/` and
  `styles/` and deploys on push to `main`. Its only run so far failed because the
  repo is private and Pages is not enabled.
- The Pages URL is a project site, so the app lives under the sub-path
  `/productivity-decision-matrix/` on the shared origin `lucijanblagonic.github.io`.
- Theme is controlled by `data-theme` on `<html>` (`src/ui/theme.js`), with an
  inline script in `index.html` applying it before first paint. Page background is
  `#f5f5f5` (light) and `#141414` (dark) from `styles/tokens.css`.
- Stored task data is a versioned document `{ version, tasks }`; `src/core/schema.js`
  `parse(raw)` already returns `ok` / `empty` / `corrupt` / `newer`. The store
  (`src/core/store.js`) has no way to replace all tasks at once, and blocks saving
  while its status is `newer-version`. Adapters have a best-effort `backup(raw)`.
- Settings is a `<dialog id="settings-dialog">` in `index.html` with three sections
  (Layout, Keyboard, Shortcuts), wired by `src/ui/settings.js`.
- E2E tests run against `npm run serve` on `http://localhost:4173`
  (`playwright.config.js`) in Chromium, Firefox and WebKit.

## Goals / Non-Goals

**Goals:**
- One deployable artefact: the same files serve the browser tab and the installed app.
- Offline support that cannot leave users stuck on an old version.
- Keep "no build step, no runtime dependencies".
- Existing e2e specs keep running unaffected by the service worker.
- Export/import reuses the existing document format and validation instead of
  defining a second format.

**Non-Goals:**
- An in-app "update available" prompt or install button; the browser's own install
  UI is enough.
- Push notifications, background sync, or any other service worker feature.
- Custom domain.
- A Chrome new-tab extension (possible later on top of the same files).
- Merging an imported file into the current board, importing from other apps'
  formats, or exporting preferences.

## Decisions

### D1. Host on GitHub Pages from a public repository
The workflow already exists and the project context requires the repo root to be
deployable to Pages as-is. Pages from a private repo needs a paid plan, so the
repo becomes public. *Alternatives:* Cloudflare Pages / Netlify with a private
repo (extra account and dashboard setup, drops the existing workflow); GitHub Pro
(monthly cost). The user chose public + Pages.

### D2. All new assets at the site root, all paths relative
`manifest.webmanifest` and `sw.js` sit next to `index.html`. A service worker's
scope is its own directory, so root placement makes it control the whole app
under the sub-path. Manifest uses `"start_url": "."` and `"scope": "."`; icon
paths are relative to the manifest; `sw.js` is registered as `'sw.js'` (relative
to the page). Nothing hard-codes `/productivity-decision-matrix/`, so local
`npm run serve` and Pages behave the same. *Alternative:* absolute paths with the
repo name — breaks locally and on any rename.

### D3. Service worker strategy: precache on install, network-first at runtime
- **Install:** `cache.addAll(PRECACHE_URLS)` where the list is `./`, `index.html`,
  `manifest.webmanifest`, the icons, and every file in `src/` and `styles/`. Requests
  are made with `cache: 'reload'` so the precache never stores a stale HTTP-cached copy.
  Then `self.skipWaiting()`.
- **Activate:** delete every cache whose name is not the current `CACHE_NAME`, then
  `self.clients.claim()`.
- **Fetch:** only same-origin `GET`. Try `fetch(request, { cache: 'no-cache' })`
  (revalidates with the server, so a deploy shows up on the next online load despite
  Pages' `max-age=600`); on a successful response, store a copy in the cache and
  return it. If the fetch rejects (offline), return `caches.match(request,
  { ignoreSearch: true })`, and for navigation requests fall back to the cached
  `index.html`.

Network-first is chosen because the spec requires a new deploy to be picked up on
the next online load. *Alternatives:* cache-first (fastest, but shows the old
version until a second reload and needs disciplined cache-version bumps);
stale-while-revalidate (same one-load lag). The app is ~30 small files, so the
cost of network-first is negligible.

### D4. Hand-maintained precache list, guarded by a unit test
With no build step there is nothing to generate the list. `sw.js` declares
`const PRECACHE_URLS = [ ... ]` as plain single-quoted string literals, one per line.
`tests/unit/sw-precache.test.js` reads `sw.js` as text, extracts the literals, walks
`src/`, `styles/` and `icons/` on disk, and fails if any file is missing from the
list or any listed file does not exist. Adding a module without updating the list
therefore fails `npm test`. *Alternative:* runtime caching only — the first visit
would not be fully offline-capable because modules load before the worker controls
the page.

### D5. Cache name is a manual version constant
`const CACHE_NAME = 'decision-matrix-v1'`. Because runtime is network-first, the
cache refreshes itself on every online load; the constant only needs bumping when
the precache list changes shape and old entries should be dropped.

### D6. Registration is best-effort and silent
`src/main.js` registers the worker at the end of `main()`, guarded by
`'serviceWorker' in navigator`, with rejections swallowed. No banner on failure:
the app is fully usable online without it (spec: "Offline support unavailable").

### D7. Icon: monochrome 2×2 grid, SVG source, committed PNG renders
`icons/icon.svg` — 512×512, rounded-square background `#141414`, four rounded
squares in `#f5f5f5`; the top-right one (the "Do" quadrant) at full opacity, the
other three at 35% opacity. `icons/icon-maskable.svg` — same grid scaled into the
central 60% on a full-bleed `#141414` background (inside the maskable safe zone).
PNGs (`icon-192.png`, `icon-512.png`, `icon-maskable-512.png`,
`apple-touch-icon.png` at 180) are rendered by `scripts/render-icons.mjs` using
Playwright's Chromium and **committed**; the script is dev-only and not run in CI.
This matches the monochrome visual style and adds no dependency. *Alternative:*
adding `sharp` or similar — a new dependency for a one-off render.

### D8. Manifest colours and browser theme colour
Manifest `background_color` and `theme_color` are both `#141414`, matching the
icon background so the launch splash looks intentional in either OS theme.
`index.html` carries two `<meta name="theme-color">` tags (light `#f5f5f5`, dark
`#141414`) with `media="(prefers-color-scheme: …)"`. `src/ui/theme.js`
`applyPreference` sets both tags' `content` to the chosen theme's colour when the
preference is Light or Dark, and restores the two defaults for System, so the
installed app's title bar matches a manual theme choice. This is cosmetic browser
chrome and stays out of the `theming` spec.

### D9. Existing e2e specs block service workers
`playwright.config.js` sets `use.serviceWorkers: 'block'`; `tests/e2e/pwa.spec.js`
opts in with `test.use({ serviceWorkers: 'allow' })`. This keeps the existing specs
deterministic. The offline-reload test runs in Chromium only
(`context.setOffline(true)` with service workers is not reliable in Playwright's
Firefox and WebKit); the manifest tests run in all three, and the registration
test in Chromium and Firefox (WebKit's worker activation proved flaky on Linux CI).

### D10. Export file is the stored document plus a timestamp
`{ "version": 1, "exportedAt": "<ISO timestamp>", "tasks": [...] }`. `validate()`
ignores unknown top-level fields, so the file passes the existing schema unchanged
and a future `migrate()` applies to imports for free. File name:
`decision-matrix-YYYY-MM-DD.json` using `todayISO` from `src/core/dates.js`.
*Alternative:* a separate envelope format — a second schema to version and test
for no user benefit.

### D11. Pure transfer logic in `src/core/transfer.js`
Three DOM-free functions, unit tested: `serializeExport(tasks, now)` → JSON string;
`exportFilename(now)` → file name; `parseImport(raw)` → `{ status: 'ok', tasks }`,
`{ status: 'invalid' }` or `{ status: 'newer' }`. `parseImport` delegates to
`schema.parse`, maps `corrupt` and `empty` to `invalid`, and additionally rejects
duplicate task ids (which `validate()` does not check and which would break
rendering keyed by id). Text longer than 5,000,000 characters is `invalid` without
parsing, since it could never fit in `localStorage` anyway.

### D12. Import replaces, through one new store method
`store.replaceAll(tasks)` returns `false` and does nothing when status is
`newer-version` (the spec forbids writing over newer data). Otherwise it: calls
`adapter.backup(<current snapshot>)` if the adapter has `backup` and the board is
non-empty; clears the pending undo; sets `state.tasks`; notifies; schedules a save;
returns `true`. Saving goes through the normal path, so other tabs pick the import
up via the existing storage-event reload. *Alternative:* merge by id with
last-edited-wins — more rules, deleted tasks can reappear; the user chose replace.

### D13. UI: a "Data" section in Settings with inline confirmation
New section between Keyboard and Shortcuts in `#settings-dialog`: two rows of
buttons — **Export file** and **Copy** to get a board out, **Import file** and
**Paste** to bring one in (see D15 for the clipboard pair) — a visually hidden
`<input type="file" accept="application/json,.json">`, a hint line, and a status
line (`role="status"`). Choosing a valid file swaps the two
buttons for an inline confirmation — "Replace the 3 tasks on this board with 5 tasks
from backup.json?" with **Replace board** and **Cancel** — and moves focus to
Cancel. Rejections and the success message appear in the status line and are
announced. Wiring lives in a new `src/ui/data-transfer.js` (`initDataTransfer`),
called from `src/main.js`, to keep `settings.js` focused on preferences.
*Alternatives:* `window.confirm` — unstyled and not testable for a11y; a nested
second `<dialog>` — more focus management for a two-button question.

### D14. Download and read with plain browser APIs
Export: `Blob` → `URL.createObjectURL` → a temporary `<a download>` click → revoke.
Import: `await file.text()`. No File System Access API (Chromium-only), no
dependency. The file input's value is cleared after each attempt so the same file
can be chosen again.

### D15. Clipboard transfer: Copy and Paste, with a paste field as fallback
Motivation: Apple's Universal Clipboard makes "copy on the iPhone, paste on the
Mac" the lowest-effort way to move a board between devices without a server.
- **Copy:** `navigator.clipboard.writeText(serializeExport(tasks, now()))` — exactly
  the export file's content, so both paths share one format and one parser.
- **Paste:** `navigator.clipboard.readText()` called directly in the click handler
  (Safari and Firefox require a user gesture and show their own small "Paste"
  prompt), then the same `parseImport` → inline confirmation → `store.replaceAll`
  path as a file. The confirmation names the source as "the clipboard".
- **Fallback:** if `navigator.clipboard?.readText` is missing or rejects, reveal a
  labelled `<textarea>` with an **Import pasted text** button. The user pastes with
  the keyboard or long-press and the text goes through the same path.
- The Clipboard API needs a secure context; GitHub Pages (HTTPS) and `localhost`
  both qualify.

*Alternatives:* a paste field only (works everywhere but adds a step on browsers
that can read the clipboard); the Web Share API (shares to apps, cannot receive);
QR code (fine for tiny boards, fails once the JSON exceeds a QR's capacity).

## Risks / Trade-offs

- [Repo history and commit author email become public] → Scan the full history for
  secrets and review the author email **before** changing visibility; stop and ask
  if anything is found. Visibility can be flipped back, but anything exposed in the
  meantime cannot be recalled.
- [A broken service worker could trap users on a bad version] → Network-first with
  revalidation means any online load fetches fresh files, including a fixed `sw.js`
  (browsers always revalidate the worker script itself).
- [Precache list drifts from the real file set] → Unit test in D4 fails `npm test`
  and the Test workflow.
- [`cache.addAll` is all-or-nothing; one 404 fails install] → Same unit test checks
  every listed file exists; the Pages workflow copies the same directories.
- [Shared origin `lucijanblagonic.github.io`: `localStorage` and cache storage are
  shared with any other Pages project of the same account] → All keys are already
  prefixed `decision-matrix:` and the cache is named `decision-matrix-v1`; the
  worker's scope is limited to the app's sub-path.
- [Network-first waits on a slow connection before falling back] → Accepted; the
  fallback only triggers when the fetch fails outright.
- [Cleared browser data wipes a board, now for other people too] → Export/import in
  this change, documented in the README as the way to back up.
- [Import replaces the whole board; a wrong file loses tasks] → Confirmation states
  both counts and the file name before anything changes, and the previous board is
  kept under a backup key. There is no in-app restore for that backup; it is a
  safety net reachable through browser developer tools.
- [Each import adds one backup entry to `localStorage`, which is never cleaned up]
  → Accepted for now; boards are a few kilobytes. If storage fills, the existing
  "Storage unavailable" warning applies.
- [Universal Clipboard is outside the app's control: it needs both devices on the
  same Apple account with Handoff on and near each other, and the copied text
  expires after about two minutes] → README says so and points to Export file as
  the dependable route; the paste field covers browsers that refuse clipboard reads.
- [Copy puts every task in plain text on the clipboard, where clipboard-history
  tools can keep it] → It is an explicit user action; the hint line says what Copy
  does.
- [Clipboard permission behaviour differs per browser and cannot be granted in
  Playwright's Firefox and WebKit] → Real clipboard tests run in Chromium only;
  the paste-field fallback is tested in all three by stubbing `readText` to reject.
- [A hand-edited export passes validation but holds odd data, e.g. duplicate order
  values] → Same tolerance as stored data today; duplicate ids, the one case that
  breaks rendering, are rejected (D11).

## Migration Plan

1. Land the PWA code on a branch; `npm test` and `npm run test:e2e` green.
2. Pre-flight the history, then make the repo public and enable Pages (Actions source).
3. Merge to `main`; the Pages workflow deploys.
4. Verify the live URL, then set it as the repository homepage.

Rollback: disable Pages or make the repo private again. To retire the service
worker for existing visitors, deploy an `sw.js` that unregisters itself and clears
its caches.
